// Walkhub
// Copyright (C) 2015 Pronovix
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU Affero General Public License as
// published by the Free Software Foundation, either version 3 of the
// License, or (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU Affero General Public License for more details.
//
// You should have received a copy of the GNU Affero General Public License
// along with this program.  If not, see <http://www.gnu.org/licenses/>.

package walkhub

import (
	"crypto/tls"
	"errors"
	"net/http"
	"net/smtp"
	"net/url"
	"strings"
	"text/template"
	"time"

	"github.com/go-kit/kit/metrics"
	"github.com/go-kit/kit/metrics/prometheus"
	stdprometheus "github.com/prometheus/client_golang/prometheus"
	"github.com/spf13/viper"
	"github.com/tamasd/ab"
	"github.com/tamasd/ab/providers/auth/google"
	"github.com/tamasd/ab/services/auth"
	"github.com/tamasd/ab/services/search"
)

type WalkhubServer struct {
	*ab.Server
	BaseURL        string
	HTTPAddr       string
	HTTPOrigin     string
	RedirectAll    bool
	EnforceDomains bool
	CustomPaths    []string
	PWAuth         bool
	AuthCreds      struct {
		SMTP struct {
			Addr                               string
			Identity, Username, Password, Host string
		}
		Google auth.OAuthCredentials
	}
}

func prometheusMiddleware() func(http.Handler) http.Handler {
	requestDuration := prometheus.NewSummary(stdprometheus.SummaryOpts{
		Namespace: "walkhub",
		Subsystem: "main",
		Name:      "request_duration_nanoseconds_count",
		Help:      "Total time spent serving requests.",
	}, []string{
		"method",
		"url",
	})

	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			defer func(begin time.Time) {
				requestDuration.
					With(metrics.Field{Key: "method", Value: r.Method}).
					With(metrics.Field{Key: "url", Value: r.URL.String()}).
					Observe(int64(time.Since(begin)))
			}(time.Now())
			next.ServeHTTP(w, r)
		})
	}
}

func domainEnforcerMiddleware(httpsHost, httpHost string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			if httpsHost != "" && r.TLS != nil && r.Host != httpsHost {
				http.Redirect(w, r, "https://"+httpsHost+"/"+r.RequestURI, http.StatusMovedPermanently)
				return
			}
			if httpHost != "" && r.TLS == nil && r.Host != httpHost {
				http.Redirect(w, r, "http://"+httpHost+"/"+r.RequestURI, http.StatusMovedPermanently)
				return
			}

			next.ServeHTTP(w, r)
		})
	}
}

func NewServer(cfg *viper.Viper) (*WalkhubServer, error) {
	b, err := ab.PetBunny(cfg, nil, nil, prometheusMiddleware())
	if err != nil {
		return nil, err
	}

	s := &WalkhubServer{
		Server: b,
	}

	return s, nil
}

func (s *WalkhubServer) setupHTTPS() {
	baseURL, err := url.Parse(s.BaseURL)
	if err != nil {
		panic(err)
	}

	httpOrigin, err := url.Parse(s.HTTPOrigin)
	if err != nil {
		panic(err)
	}

	if s.HTTPAddr == "" {
		return
	}

	if s.RedirectAll {
		ub, err := url.Parse(s.BaseURL)
		if err != nil {
			panic(err)
		}

		go ab.HTTPSRedirectServer(ub.Host, s.HTTPAddr)
	} else {
		s.Server.Use(func(next http.Handler) http.Handler {
			return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				if r.TLS != nil { // HTTPS request.
					if r.Host != baseURL.Host {
						redirectToHTTPS(w, r, baseURL)
						return
					}
				} else {
					if s.HTTPOrigin == "" || r.Host == httpOrigin.Host {
						whitelist := []string{
							"/record",
							"/walkthrough",
							"/search",
						}
						if !pathIsWhitelisted(whitelist, r.URL.Path) {
							redirectToHTTPS(w, r, baseURL)
							return
						}
					} else {
						redirectToHTTPS(w, r, baseURL)
						return
					}
				}

				next.ServeHTTP(w, r)
			})
		})

		go s.StartHTTP(s.HTTPAddr)
	}
}

func pathIsWhitelisted(whitelist []string, path string) bool {
	for _, pathPrefix := range whitelist {
		if strings.HasPrefix(path, pathPrefix) {
			return true
		}
	}

	return false
}

func redirectToHTTPS(w http.ResponseWriter, r *http.Request, httpsOrigin *url.URL) {
	newurl, _ := url.Parse(r.URL.String())
	newurl.Scheme = "https"
	if httpsOrigin != nil {
		newurl.Host = httpsOrigin.Host
	}
	http.Redirect(w, r, newurl.String(), http.StatusMovedPermanently)
}

func corsPreflightHandler(baseURL, httpOrigin string) http.Handler {
	baseurl, err := url.Parse(baseURL)
	if err != nil {
		panic(err)
	}

	httporigin, err := url.Parse(httpOrigin)
	if err != nil {
		panic(err)
	}

	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		origin := r.Header.Get("Origin")
		method := r.Header.Get("Access-Control-Request-Method")
		headers := r.Header.Get("Access-Control-Request-Headers")

		w.Header().Add("Vary", "Origin")
		w.Header().Add("Vary", "Access-Control-Request-Method")
		w.Header().Add("Vary", "Access-Control-Request-Headers")

		if origin == "" || method == "" {
			ab.Fail(r, http.StatusBadRequest, nil)
		}

		originurl, err := url.Parse(origin)
		ab.MaybeFail(r, http.StatusBadRequest, err)

		if originurl.Host != baseurl.Host && originurl.Host != httporigin.Host {
			ab.Fail(r, http.StatusForbidden, nil)
		}

		w.Header().Set("Access-Control-Allow-Origin", origin)
		w.Header().Set("Access-Control-Allow-Methods", method)
		w.Header().Set("Access-Control-Allow-Headers", headers)
		w.Header().Set("Access-Control-Allow-Credentials", "true")
		w.Header().Set("Access-Control-Max-Age", "0")

		ab.Render(r).SetCode(http.StatusOK)
	})
}

func corsMiddleware(baseURL, httpOrigin string) func(http.Handler) http.Handler {
	baseurl, err := url.Parse(baseURL)
	if err != nil {
		panic(err)
	}

	httporigin, err := url.Parse(httpOrigin)
	if err != nil {
		panic(err)
	}

	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			origin := r.Header.Get("origin")
			if origin != "" {
				originurl, err := url.Parse(origin)
				if err == nil {
					if originurl.Host == baseurl.Host || originurl.Host == httporigin.Host {
						w.Header().Set("Access-Control-Allow-Origin", origin)
						w.Header().Set("Access-Control-Allow-Credentials", "true")
					}
				}
			}

			next.ServeHTTP(w, r)
		})
	}
}

func (s *WalkhubServer) Start(addr string, certfile string, keyfile string) error {
	frontendPaths := []string{
		"/user/:uuid",
		"/connect",
		"/record",
		"/walkthrough/:uuid",
		"/search",
		"/embedcode",
		"/helpcenterlist",
		"/profile/:uuid",
	}
	for _, path := range append(frontendPaths, s.CustomPaths...) {
		s.AddFile(path, "assets/index.html")
	}

	s.Options("/*path", corsPreflightHandler(s.BaseURL, s.HTTPOrigin))

	s.Use(corsMiddleware(s.BaseURL, s.HTTPOrigin))

	UserDelegate.DB = s.GetDBConnection()

	authProviders := []auth.AuthProvider{}
	if s.PWAuth {
		smtpAuth := smtp.PlainAuth(s.AuthCreds.SMTP.Identity, s.AuthCreds.SMTP.Username, s.AuthCreds.SMTP.Password, s.AuthCreds.SMTP.Host)
		delegate := auth.NewPasswordAuthSMTPEmailSenderDelegate(s.AuthCreds.SMTP.Addr, smtpAuth, s.BaseURL)
		delegate.RegistrationEmailTemplate = regMailTemplate
		delegate.LostPasswordEmailTemplate = lostpwMailTemplate
		pwauth := auth.NewPasswordAuthProvider(NewPasswordDelegate(s.GetDBConnection()), delegate)
		authProviders = append(authProviders, pwauth)
	}
	if !s.AuthCreds.Google.Empty() {
		gauth := google.NewGoogleAuthProvider(s.AuthCreds.Google, &GoogleUserDelegate{})
		authProviders = append(authProviders, gauth)
	}
	if len(authProviders) == 0 {
		return errors.New("no authentication providers are enabled")
	}
	authsvc := auth.NewService(s.BaseURL, UserDelegate, s.GetDBConnection(), authProviders...)
	s.RegisterService(authsvc)

	s.RegisterService(&UserService{})

	searchsvc := search.NewSearchService(s.GetDBConnection(), nil)
	searchsvc.AddDelegate("walkthrough", &walkhubSearchDelegate{
		db: s.GetDBConnection(),
	})
	s.RegisterService(searchsvc)

	s.RegisterService(&WalkthroughService{
		SearchService: searchsvc,
		BaseURL:       s.BaseURL,
	})

	s.RegisterService(&EmbedLogService{})

	s.RegisterService(&LogService{
		BaseURL: s.BaseURL,
	})

	s.Get("/metrics", stdprometheus.Handler(), ab.RestrictPrivateAddressMiddleware())

	if certfile != "" && keyfile != "" {
		s.setupHTTPS()
		if s.TLSConfig == nil {
			s.TLSConfig = &tls.Config{}
		}

		if s.TLSConfig.ServerName == "" {
			s.TLSConfig.ServerName = s.BaseURL
		}
	}

	return s.StartHTTPS(addr, certfile, keyfile)
}

var (
	regMailTemplate = template.Must(template.New("regMailTemplate").Parse(
		"To: {{.Mail}}" +
			"Subject: Activate your WalkHub account\r\n" +
			"\r\n" +
			"Hi {{.Mail}},\r\n" +
			"\r\n" +
			"Welcome to WalkHub. Thank you for joining us.\r\n" +
			"WalkHub helps you to create walkthroughs for your website to support your users.\r\n" +
			"Click the following link to activate your account and set up your password:\r\n" +
			"{{.Url}}\r\n" +
			"\r\n" +
			"Have any questions? We’re always here to help.\r\n" +
			"\r\n" +
			"Cheers,\r\n" +
			"The WalkHub Team\r\n" +
			"\r\n"))
	lostpwMailTemplate = template.Must(template.New("lostpwMailTemplate").Parse(
		"To: {{.Mail}}\r\n" +
			"Subject: Reset your WalkHub password\r\n" +
			"\r\n" +
			"Hi {{.Mail}},\r\n" +
			"\r\n" +
			"You requested to reset your password for your WalkHub account.\r\n" +
			"Click the link to reset it:\r\n" +
			"{{.Url}}\r\n" +
			"\r\n" +
			"This password reset link is one-time only.\r\n" +
			"If you did not request a password reset, please ignore this email.\r\n" +
			"\r\n" +
			"Thank you,\r\n" +
			"The WalkHub Team\r\n" +
			"\r\n"))
)
