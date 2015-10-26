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
	"flag"
	"fmt"
	"io/ioutil"
	"log"
	"net/http"
	"net/http/cookiejar"
)

var (
	port  = flag.Uint("port", 80, "")
	https = flag.Bool("https", false, "")
)

var base string

func main() {
	flag.Parse()

	scheme := "http"
	if *https {
		scheme = "https"
	}

	base = fmt.Sprintf("%s://127.0.0.1:%d", scheme, *port)

	http.DefaultClient.Jar, _ = cookiejar.New(nil)

	token := getToken()

	req, _ := http.NewRequest("POST", base+"/api/reindexwalkthroughs", nil)
	req.Header.Set("X-CSRF-Token", token)
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		log.Fatalln(err)
	}
	if resp.StatusCode != http.StatusAccepted {
		log.Fatalln("Invalid status code: %d", resp.StatusCode)
	}
}

func getToken() string {
	req, _ := http.NewRequest("GET", base+"/api/token", nil)
	req.Header.Add("Accept", "text/plain")
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		log.Fatalln(err)
	}

	b, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		log.Fatalln(err)
	}

	return string(b)
}
