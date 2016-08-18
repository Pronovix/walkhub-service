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

	"github.com/lib/pq"
	"gitlab.com/tamasd/ab"
	"gitlab.com/tamasd/ab/providers/auth/google"
	"gitlab.com/tamasd/ab/services/auth"
	"google.golang.org/api/plus/v1"
)

var UserDelegate = &auth.SessionUserDelegate{}

type User struct {
	UUID     string `dbtype:"uuid" dbdefault:"uuid_generate_v4()"`
	Name     string `constructor:"true"`
	Mail     string `constructor:"true"`
	Admin    bool
	Created  time.Time
	LastSeen time.Time
}

func (u *User) GetID() string {
	return u.UUID
}

var _ ab.EntityDelegate = userEntityDelegate{}

type userEntityDelegate struct{}

func (d userEntityDelegate) Validate(e ab.Entity) error {
	return nil
}

func (d userEntityDelegate) AlterSQL(sql string) string {
	return sql + `
		ALTER TABLE auth ADD CONSTRAINT auth_uuid_fkey FOREIGN KEY (uuid) REFERENCES "user" (uuid) MATCH SIMPLE ON UPDATE CASCADE ON DELETE CASCADE;
		ALTER TABLE "user" ADD CONSTRAINT user_mail_key UNIQUE (mail);
	`
}

func userService(ec *ab.EntityController) ab.Service {
	res := ab.EntityResource(ec, &User{}, ab.EntityResourceConfig{
		DisableList: true,
	})

	res.ExtraEndpoints = func(srv *ab.Server) error {
		srv.Get("/api/user", http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			sess := ab.GetSession(r)
			if sess["uid"] != "" {
				db := ab.GetDB(r)

				user, err := ec.Load(db, "user", sess["uid"])
				ab.MaybeFail(http.StatusInternalServerError, err)

				ab.Render(r).
					JSON(user)
			}
		}))

		return nil
	}

	return res
}

func userLoggedInMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if !UserDelegate.IsLoggedIn(r) {
			ab.Fail(http.StatusForbidden, errors.New("user is not logged in"))
		}
		next.ServeHTTP(w, r)
	})
}

var _ google.GoogleUserDelegate = &GoogleUserDelegate{}

type GoogleUserDelegate struct {
}

func (gud *GoogleUserDelegate) Convert(u *plus.Person) (ab.Entity, error) {
	mail := ""
	for _, m := range u.Emails {
		if m != nil && m.Type == "account" {
			mail = m.Value
			break
		}
	}

	if mail == "" {
		return nil, google.ErrorNoEmail{
			Emails: u.Emails,
		}
	}

	return &User{
		Name:    u.DisplayName,
		Mail:    mail,
		Created: time.Now(),
	}, nil
}

func (gud *GoogleUserDelegate) ResolveUniqueID(db ab.DB, entity ab.Entity) (string, error) {
	if user, ok := entity.(*User); ok {
		var uuid string
		err := db.QueryRow(`SELECT uuid FROM "user" WHERE mail = $1`, user.Mail).Scan(&uuid)
		if err != nil {
			return "", err
		}
		return uuid, nil
	}
	return "", nil
}

type userRegData struct {
	*User
	auth.PasswordFields
}

func (u *userRegData) GetEntity() ab.Entity {
	return u.User
}

var _ auth.PasswordAuthProviderDelegate = &PasswordDelegate{}

type PasswordDelegate struct {
	db         ab.DB
	controller *ab.EntityController
}

func NewPasswordDelegate(db ab.DB, ec *ab.EntityController) *PasswordDelegate {
	return &PasswordDelegate{
		db:         db,
		controller: ec,
	}
}

func (d *PasswordDelegate) GetPassword() auth.Password {
	return &userRegData{
		User:           &User{},
		PasswordFields: auth.PasswordFields{},
	}
}

func (d *PasswordDelegate) GetDBErrorConverter() func(err *pq.Error) ab.VerboseError {
	return func(err *pq.Error) ab.VerboseError {
		return ab.NewVerboseError(err.Error(), "")
	}
}

func (d *PasswordDelegate) GetAuthID(entity ab.Entity) string {
	return d.GetEmail(entity)
}

func (d *PasswordDelegate) GetEmail(entity ab.Entity) string {
	if rd, ok := entity.(*userRegData); ok {
		return rd.Mail
	}

	if u, ok := entity.(*User); ok {
		return u.Mail
	}

	return ""
}

func (d *PasswordDelegate) Get2FAIssuer() string {
	return "WalkHub"
}

func (d *PasswordDelegate) LoadUser(uuid string) (ab.Entity, error) {
	user, err := d.controller.Load(d.db, "user", uuid)
	if err != nil {
		return nil, err
	}
	if user == nil {
		return nil, nil
	}

	return user, nil
}

func (d *PasswordDelegate) LoadUserByMail(mail string) (ab.Entity, error) {
	users, err := d.controller.LoadFromQuery(d.db, "user", "SELECT "+d.controller.FieldList("user")+" FROM \"user\" u WHERE u.mail = $1", mail)
	// this is here to make sure that the returned interface is nil,
	// not just the interface data
	if len(users) != 1 {
		return nil, err
	}
	return users[0], err
}
