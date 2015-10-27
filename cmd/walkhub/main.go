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
	"log"
	"net/url"
	"runtime"
	"time"

	"github.com/Pronovix/walkhub-service"
	"github.com/spf13/viper"
	"github.com/tamasd/ab"
	"github.com/tamasd/ab/services/auth"
	"github.com/tamasd/ab/util"
)

func isHTTPS(baseurl string) bool {
	u, err := url.Parse(baseurl)
	if err != nil {
		log.Fatalln(err)
	}

	return u.Scheme == "https"
}

func main() {
	runtime.GOMAXPROCS(runtime.NumCPU())

	viper.SetConfigName("config")
	viper.AddConfigPath(".")
	viper.AutomaticEnv()
	viper.ReadInConfig()

	secret, err := hex.DecodeString(viper.GetString("secret"))
	if err != nil {
		log.Println(err)
	}
	cookieSecret, err := hex.DecodeString(viper.GetString("cookiesecret"))
	if err != nil {
		log.Println(err)
	}

	baseurl := viper.GetString("baseurl")

	cfg := ab.ServerConfig{
		PGConnectString: viper.GetString("db"),
		CookiePrefix:    "WALKHUB",
		CookieSecret:    cookieSecret,
		DevelopmentMode: viper.GetBool("debug"),
	}

	if isHTTPS(baseurl) {
		cfg.HSTS = &ab.HSTSConfig{
			MaxAge: time.Hour * 24 * 365,
		}
	}

	util.SetKey(secret)

	s := walkhub.NewServer(cfg)
	s.BaseURL = baseurl
	s.HTTPAddr = viper.GetString("httpaddr")
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
	s.Start(host+":"+port, viper.GetString("certfile"), viper.GetString("keyfile"))
}
