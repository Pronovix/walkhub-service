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

package main

import (
	"encoding/hex"
	"encoding/json"
	"net/url"
	"os"
	"runtime"

	"github.com/Pronovix/walkhub-service"
	"github.com/spf13/viper"
	"github.com/tamasd/ab/lib/log"
	"github.com/tamasd/ab/services/auth"
	"github.com/tamasd/ab/util"
)

func isHTTPS(baseurl string) bool {
	u, err := url.Parse(baseurl)
	if err != nil {
		panic(err)
	}

	return u.Scheme == "https"
}

func main() {
	runtime.GOMAXPROCS(runtime.NumCPU())
	cfg := viper.New()

	cfg.SetConfigName("config")
	cfg.AddConfigPath(".")
	cfg.AutomaticEnv()
	if err := cfg.ReadInConfig(); err != nil {
		tmplog := log.DefaultOSLogger()
		tmplog.User().Println(err)
	}

	cfg.Set("gzip", false)
	cfg.Set("CookiePrefix", "WALKHUB")
	cfg.RegisterAlias("db", "PGConnectString")

	level := log.LOG_USER
	if cfg.GetBool("trace") {
		level = log.LOG_TRACE
	} else if cfg.GetBool("debug") {
		level = log.LOG_VERBOSE
	}
	cfg.Set("LogLevel", int(level))

	whlogger := log.DefaultOSLogger()
	whlogger.Level = level

	secret, err := hex.DecodeString(cfg.GetString("secret"))
	if err != nil {
		whlogger.User().Println(err)
	}

	baseurl := cfg.GetString("baseurl")
	httpOrigin := cfg.GetString("httporigin")
	hstsHostBlacklist := []string{}
	if httpOrigin != "" {
		hstsHostBlacklist = append(hstsHostBlacklist, httpOrigin)
	}

	util.SetKey(secret)

	s, err := walkhub.NewServer(cfg)
	if err != nil {
		whlogger.Fatalln(err)
	}
	s.BaseURL = baseurl
	s.HTTPAddr = cfg.GetString("httpaddr")
	s.HTTPOrigin = httpOrigin
	s.RedirectAll = cfg.GetBool("redirectall")
	s.EnforceDomains = cfg.GetBool("enforcedomains")
	if cp := cfg.GetString("contentpages"); cp != "" {
		s.CustomPaths = loadContentPages(cp)
		whlogger.Verbose().Println("custom paths", s.CustomPaths)
	}
	s.AuthCreds.Google = auth.OAuthCredentials{
		ID:     cfg.GetString("google.id"),
		Secret: cfg.GetString("google.secret"),
	}

	host := cfg.GetString("HOST")
	if host == "" {
		host = "localhost"
	}
	port := cfg.GetString("PORT")
	if port == "" {
		port = "8080"
	}
	whlogger.User().Println(s.Start(host+":"+port, cfg.GetString("certfile"), cfg.GetString("keyfile")))
}

func loadContentPages(path string) []string {
	f, err := os.Open(path)
	if err != nil {
		panic(err)
	}
	defer f.Close()

	cfg := map[string]interface{}{}

	err = json.NewDecoder(f).Decode(&cfg)
	if err != nil {
		panic(err)
	}

	pages := []string{}

	for page := range cfg {
		pages = append(pages, page)
	}

	return pages
}
