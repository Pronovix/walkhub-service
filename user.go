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
	"errors"
	"net/http"
	"time"

	"github.com/nbio/hitch"
	"github.com/tamasd/ab"
	"github.com/tamasd/ab/providers/auth/google"
	"github.com/tamasd/ab/services/auth"
	"google.golang.org/api/plus/v1"
)

//go:generate abt --output=usergen.go --generate-service-struct-name=UserService --generate-service-list=false entity User

var UserDelegate = &auth.SessionUserDelegate{}

type User struct {
	UUID     string `dbtype:"uuid" dbdefault:"uuid_generate_v4()"`
	Name     string `constructor:"true"`
	Mail     string `constructor:"true"`
	Admin    bool
	Created  time.Time
	LastSeen time.Time
}

func afterUserSchemaSQL(sql string) (_sql string) {
	return sql + "\nALTER TABLE auth ADD CONSTRAINT auth_uuid_fkey FOREIGN KEY (uuid) REFERENCES \"user\" (uuid) MATCH SIMPLE ON UPDATE CASCADE ON DELETE CASCADE;"
}

func afterUserServiceRegister(h *hitch.Hitch) {
	h.Get("/api/user", http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		sess := ab.GetSession(r)
		if sess["uid"] != "" {
			db := ab.GetDB(r)

			user, err := LoadUser(db, sess["uid"])
			ab.MaybeFail(r, http.StatusInternalServerError, err)

			ab.Render(r).
				JSON(user)
		}
	}))
}

func LastSeenMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {

	})
}

func userLoggedInMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if !UserDelegate.IsLoggedIn(r) {
			ab.Fail(r, http.StatusForbidden, errors.New("user is not logged in"))
		}
		next.ServeHTTP(w, r)
	})
}

var _ google.GoogleUserDelegate = &GoogleUserDelegate{}

type GoogleUserDelegate struct {
}

func (gud *GoogleUserDelegate) Convert(u *plus.Person) ab.Entity {
	mail := ""
	for _, m := range u.Emails {
		if m != nil && m.Type == "account" {
			mail = m.Value
			break
		}
	}

	return NewUser(u.DisplayName, mail)
}
