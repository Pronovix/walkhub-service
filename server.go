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
	BaseURL   string
	HTTPAddr  string
	AuthCreds struct {
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

	ub, err := url.Parse(s.BaseURL)
	if err != nil {
		panic(err)
	}

	go ab.HTTPSRedirectServer(ub.Host, s.HTTPAddr)
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
	})

	s.RegisterService(&EmbedLogService{})

	s.Get("/metrics", stdprometheus.Handler(), ab.RestrictAddressMiddleware("127.0.0.1"))

	s.setupHTTPS()

	s.StartHTTPS(addr, certfile, keyfile)
}
