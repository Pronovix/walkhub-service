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
	"net/http"
	"net/url"
	"strings"
	"time"

	"github.com/go-kit/kit/metrics"
	"github.com/go-kit/kit/metrics/prometheus"
	stdprometheus "github.com/prometheus/client_golang/prometheus"
	"github.com/tamasd/ab"
	"github.com/tamasd/ab/providers/auth/google"
	"github.com/tamasd/ab/services/auth"
	"github.com/tamasd/ab/services/search"
)

type WalkhubServer struct {
	*ab.Server
	BaseURL     string
	HTTPAddr    string
	RedirectAll bool
	AuthCreds   struct {
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

func NewServer(cfg ab.ServerConfig) *WalkhubServer {
	s := &WalkhubServer{
		Server: ab.PetBunny(cfg),
	}

	return s
}

func (s *WalkhubServer) setupHTTPS() {
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
				if r.URL.Scheme == "http" {
					whitelist := []string{
						"record",
						"walkthrough",
						"search",
					}

					found := false
					for _, pathPrefix := range whitelist {
						if strings.HasPrefix(r.URL.Path, pathPrefix) {
							found = true
							break
						}
					}

					if !found {
						redirectToHTTPS(w, r)
						return
					}
				}

				next.ServeHTTP(w, r)
			})
		})

		go s.StartHTTP(s.HTTPAddr)
	}
}

func redirectToHTTPS(w http.ResponseWriter, r *http.Request) {
	newurl, _ := url.Parse(r.URL.String())
	newurl.Scheme = "https"
	http.Redirect(w, r, newurl.String(), http.StatusMovedPermanently)
}

func corsPreflightHandler(baseURL string) http.Handler {
	baseurl, err := url.Parse(baseURL)
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

		if originurl.Host != baseurl.Host {
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

func corsMiddleware(baseURL string) func(http.Handler) http.Handler {
	baseurl, err := url.Parse(baseURL)
	if err != nil {
		panic(err)
	}

	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			origin := r.Header.Get("origin")
			if origin != "" {
				originurl, err := url.Parse(origin)
				if err == nil {
					if originurl.Host == baseurl.Host {
						w.Header().Set("Access-Control-Allow-Origin", origin)
						w.Header().Set("Access-Control-Allow-Credentials", "true")
					}
				}
			}

			next.ServeHTTP(w, r)
		})
	}
}

func (s *WalkhubServer) Start(addr string, certfile string, keyfile string) {
	frontendPaths := []string{
		"/user/:uuid",
		"/connect",
		"/record",
		"/walkthrough/:uuid",
		"/search",
		"/embedcode",
	}
	for _, path := range frontendPaths {
		s.AddFile(path, "assets/index.html")
	}

	s.Options("/*path", corsPreflightHandler(s.BaseURL))

	s.Use(corsMiddleware(s.BaseURL))

	UserDelegate.DB = s.GetDBConnection()

	gauth := google.NewGoogleAuthProvider(s.AuthCreds.Google, &GoogleUserDelegate{})
	authsvc := auth.NewService(s.BaseURL, UserDelegate, s.GetDBConnection(), gauth)
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
	}

	s.StartHTTPS(addr, certfile, keyfile)
}
