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
	"net/url"
	"runtime"
	"time"

	"github.com/Pronovix/walkhub-service"
	"github.com/spf13/viper"
	"github.com/tamasd/ab"
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

	viper.SetConfigName("config")
	viper.AddConfigPath(".")
	viper.AutomaticEnv()
	viper.ReadInConfig()

	level := log.LOG_USER
	if viper.GetBool("trace") {
		level = log.LOG_TRACE
	} else if viper.GetBool("debug") {
		level = log.LOG_VERBOSE
	}

	whlogger := log.DefaultOSLogger()
	whlogger.Level = level

	secret, err := hex.DecodeString(viper.GetString("secret"))
	if err != nil {
		whlogger.User().Println(err)
	}
	cookieSecret, err := hex.DecodeString(viper.GetString("cookiesecret"))
	if err != nil {
		whlogger.User().Println(err)
	}

	baseurl := viper.GetString("baseurl")
	httpOrigin := viper.GetString("httporigin")
	hstsHostBlacklist := []string{}
	if httpOrigin != "" {
		hstsHostBlacklist = append(hstsHostBlacklist, httpOrigin)
	}

	var cookieurl *url.URL = nil

	if cookieurlstr := viper.GetString("cookieurl"); cookieurlstr != "" {
		cookieurl, err = url.Parse(cookieurlstr)
		if err != nil {
			panic(err)
		}
	}

	cfg := ab.ServerConfig{
		PGConnectString: viper.GetString("db"),
		CookiePrefix:    "WALKHUB",
		CookieSecret:    cookieSecret,
		Level:           level,
		Logger:          whlogger,
		DisableGzip:     true, // TODO temporary fix to make metrics work
		CookieURL:       cookieurl,
		HSTS: &ab.HSTSConfig{
			MaxAge:            time.Hour * 24 * 365,
			IncludeSubDomains: false,
			HostBlacklist:     hstsHostBlacklist,
		},
	}

	util.SetKey(secret)

	s := walkhub.NewServer(cfg)
	s.BaseURL = baseurl
	s.HTTPAddr = viper.GetString("httpaddr")
	s.HTTPOrigin = httpOrigin
	s.RedirectAll = viper.GetBool("redirectall")
	s.AuthCreds.Google = auth.OAuthCredentials{
		ID:     viper.GetString("google.id"),
		Secret: viper.GetString("google.secret"),
	}

	host := viper.GetString("HOST")
	if host == "" {
		host = "localhost"
	}
	port := viper.GetString("PORT")
	if port == "" {
		port = "8080"
	}
	whlogger.User().Println(s.Start(host+":"+port, viper.GetString("certfile"), viper.GetString("keyfile")))
}
