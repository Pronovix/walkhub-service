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
	"fmt"
	"net/http"
	"time"

	"gitlab.com/tamasd/ab"
)

type EmbedLog struct {
	UUID    string    `dbtype:"uuid" dbdefault:"uuid_generate_v4()" json:"uuid"`
	IPAddr  string    `json:"ip"`
	Created time.Time `json:"created"`
	Site    string    `json:"site"`
	Mail    string    `json:"mail"`
}

func (el *EmbedLog) GetID() string {
	return el.UUID
}

func (el *EmbedLog) Validate() error {
	if el.Site == "" {
		return errors.New("site is empty")
	}

	return nil
}

func embedlogService(ec *ab.EntityController) ab.Service {
	res := ab.EntityResource(ec, &EmbedLog{}, ab.EntityResourceConfig{
		DisableList:   true,
		DisableGet:    true,
		DisablePut:    true,
		DisableDelete: true,
	})

	res.AddPostEvent(ab.ResourceEventCallback{
		BeforeCallback: func(r *http.Request, d ab.Resource) {
			el := d.(*EmbedLog)
			el.UUID = ""
			el.Created = time.Now()
			el.IPAddr = r.RemoteAddr
		},
		AfterCallback: func(r *http.Request, d ab.Resource) {
			db := ab.GetDB(r)
			el := d.(*EmbedLog)
			DBLog(db, ec, "embedlog", fmt.Sprintf("%s (%s) has created an embed log on %s at %s", el.Mail, el.IPAddr, el.Site, el.Created.String()))
		},
	})

	return res
}
