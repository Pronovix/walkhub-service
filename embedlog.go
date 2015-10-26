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
)

//go:generate ab --output=embedloggen.go --generate-service-struct-name=EmbedLogService --generate-crud-update=false --generate-crud-delete=false --generate-service-list=false --generate-service-get=false --generate-service-put=false --generate-service-patch=false --generate-service-delete=false entity EmbedLog

type EmbedLog struct {
	UUID    string    `dbtype:"uuid" dbdefault:"uuid_generate_v4()" json:"uuid"`
	IPAddr  string    `json:"ip"`
	Created time.Time `json:"created"`
	Site    string    `json:"site"`
	Mail    string    `json:"mail"`
}

func validateEmbedLog(e *EmbedLog) (err error) {
	if e.Site == "" {
		return errors.New("site is empty")
	}

	return nil
}

func embedlogPostValidation(r *http.Request, entity *EmbedLog) {
	entity.UUID = ""
	entity.Created = time.Now()
	entity.IPAddr = r.RemoteAddr
}
