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
	"html"
	"log"
	"net/http"
	"net/url"
	"strings"
	"sync"
	"time"

	"github.com/nbio/hitch"
	"github.com/pborman/uuid"
	"github.com/tamasd/ab"
	"github.com/tamasd/ab/services/search"
	"github.com/tamasd/ab/util"
)

//go:generate abt --output=walkthroughgen.go --generate-service-struct=false --generate-service-struct-name=WalkthroughService --generate-crud-update=false --generate-crud-delete=false --urlidfield=1 --idfield=1 entity Walkthrough

type WalkthroughService struct {
	SearchService *search.SearchService
	BaseURL       string
}

type Step struct {
	Title         string `json:"title"`
	Description   string `json:"description"`
	StepHighlight string `json:"highlight"`
	Command       string `json:"cmd"`
	Arg0          string `json:"arg0"`
	Arg1          string `json:"arg1"`
}

type Walkthrough struct {
	Revision    string    `dbtype:"uuid" dbdefault:"uuid_generate_v4()" json:"revision"`
	UUID        string    `dbtype:"uuid" dbdefault:"uuid_generate_v4()" json:"uuid"`
	UID         string    `dbtype:"uuid" json:"uid"`
	Name        string    `constructor:"true" json:"name"`
	Description string    `dbtype:"text" json:"description"`
	Severity    string    `dbtype:"walkthrough_severity" dbdefault:"'tour'" json:"severity"`
	Steps       []Step    `dbtype:"jsonb" json:"steps"`
	Updated     time.Time `json:"updated"`
	Published   bool      `json:"published"`
}

func validateWalkthrough(e *Walkthrough) (_err error) {
	if e.Severity != "tour" && e.Severity != "content" && e.Severity != "configuration" {
		return ab.NewVerboseError("", "invalid severity")
	}

	if e.Name == "" {
		return ab.NewVerboseError("", "name must not be empty")
	}

	if e.UID == "" {
		return ab.NewVerboseError("", "uid must not be empty")
	}

	if len(e.Steps) == 0 {
		return ab.NewVerboseError("", "a walkthrough must have at least one step")
	}

	return nil
}

func afterWalkthroughSchemaSQL(sql string) (_sql string) {
	return `
		CREATE TYPE walkthrough_severity AS ENUM ('tour', 'content', 'configuration');
		` + sql + `
		ALTER TABLE walkthrough ADD CONSTRAINT walkthrough_uuid_fkey FOREIGN KEY (uid)
			REFERENCES "user" (uuid) MATCH SIMPLE
			ON UPDATE CASCADE ON DELETE CASCADE;
	`
}

func beforeWalkthroughInsert(e *Walkthrough) {
	if e.UUID == "" {
		e.UUID = uuid.NewRandom().String()
	}
}

func (e *Walkthrough) Update(db ab.DB) error {
	e.Revision = ""
	return e.Insert(db)
}

func (e *Walkthrough) Delete(db ab.DB) error {
	res, err := db.Exec("UPDATE walkthrough SET published = false WHERE UUID = $1", e.UUID)
	if err != nil {
		return err
	}

	aff, err := res.RowsAffected()
	if err != nil {
		return err
	}

	if aff < 1 {
		return WalkthroughNotFoundError
	}

	return nil
}

func LoadAllActualWalkthroughs(db ab.DB, start, limit int) ([]*Walkthrough, error) {
	return selectWalkthroughFromQuery(db, `WITH
	latestwt AS (SELECT uuid, MAX(updated) u FROM walkthrough WHERE published = true GROUP BY uuid ORDER BY u DESC),
	latestuuid AS (SELECT w.revision FROM latestwt l JOIN walkthrough w ON l.uuid = w.uuid AND l.u = w.updated)
	SELECT `+walkthroughFields+` FROM walkthrough w JOIN latestuuid l ON l.revision = w.revision ORDER BY updated DESC`)
}

func LoadActualRevisions(db ab.DB, uuids []string) ([]*Walkthrough, error) {
	placeholders := util.GeneratePlaceholders(1, uint(len(uuids))+1)
	return selectWalkthroughFromQuery(db, `WITH
	latestwt AS (SELECT uuid, MAX(updated) u FROM walkthrough WHERE published = true GROUP BY uuid ORDER BY u DESC),
	latestuuid AS (SELECT w.revision FROM latestwt l JOIN walkthrough w ON l.uuid = w.uuid AND l.u = w.updated)
	SELECT `+walkthroughFields+` FROM walkthrough w JOIN latestuuid l ON l.revision = w.revision WHERE w.uuid IN (`+placeholders+`)
	`, util.StringSliceToInterfaceSlice(uuids)...)
}

func LoadActualRevision(db ab.DB, UUID string) (*Walkthrough, error) {
	return selectSingleWalkthroughFromQuery(db, "SELECT "+walkthroughFields+" FROM walkthrough w WHERE UUID = $1 AND published = true ORDER BY Updated DESC LIMIT 1", UUID)
}

func beforeWalkthroughServiceRegister() (listMiddlewares, postMiddlewares, getMiddlewares, putMiddlewares, deleteMiddlewares []func(http.Handler) http.Handler) {
	postMiddlewares = append(postMiddlewares, userLoggedInMiddleware)
	putMiddlewares = append(putMiddlewares, userLoggedInMiddleware)
	deleteMiddlewares = append(deleteMiddlewares, userLoggedInMiddleware)

	return listMiddlewares, postMiddlewares, getMiddlewares, putMiddlewares, deleteMiddlewares
}

func afterWalkthroughServiceRegister(s *WalkthroughService, h *hitch.Hitch) {
	reindexing := false
	var reindexingMutex sync.RWMutex
	h.Post("/api/reindexwalkthroughs", http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		reindexingMutex.RLock()
		idxing := reindexing
		reindexingMutex.RUnlock()

		if idxing {
			ab.Fail(r, http.StatusServiceUnavailable, errors.New("reindexing is in progress"))
		}

		reindexingMutex.Lock()
		reindexing = true
		reindexingMutex.Unlock()

		db := ab.GetDB(r)

		go func() {
			defer func() {
				reindexingMutex.Lock()
				reindexing = false
				reindexingMutex.Unlock()
			}()
			err := s.SearchService.PurgeIndex()
			if err != nil {
				log.Println(err)
				return
			}

			wts, err := LoadAllActualWalkthroughs(db, 0, 0)
			if err != nil {
				log.Println(err)
				return
			}

			for _, wt := range wts {
				err = s.SearchService.IndexEntity("walkthrough", wt)
				if err != nil {
					log.Println(err)
					return
				}
			}
		}()

		ab.Render(r).SetCode(http.StatusAccepted)
	}), ab.RestrictPrivateAddressMiddleware())

}

func beforeWalkthroughListHandler() (_loadFunc func(ab.DB, int, int) ([]*Walkthrough, error)) {
	return LoadAllActualWalkthroughs
}

func beforeWalkthroughGetHandler() (_loadFunc func(ab.DB, string) (*Walkthrough, error)) {
	return LoadActualRevision
}

func walkthroughPostValidation(entity *Walkthrough, r *http.Request) {
	uid := UserDelegate.CurrentUser(r)
	if entity.UID == "" {
		entity.UID = uid
	}
	if entity.UID != uid {
		ab.Fail(r, http.StatusBadRequest, errors.New("invalid user id"))
	}

	entity.Updated = time.Now()
	entity.Revision = ""
	entity.UUID = ""
}

func beforeWalkthroughPutUpdateHandler(r *http.Request, entity *Walkthrough, db ab.DB) {
	uid := UserDelegate.CurrentUser(r)
	currentUser, err := LoadUser(db, uid)
	ab.MaybeFail(r, http.StatusBadRequest, err)
	if entity.UID != uid {
		if !currentUser.Admin {
			ab.Fail(r, http.StatusForbidden, nil)
		}
	}

	previousRevision, err := LoadActualRevision(db, entity.UUID)
	ab.MaybeFail(r, http.StatusBadRequest, err)
	if previousRevision == nil {
		ab.Fail(r, http.StatusNotFound, nil)
	}

	if previousRevision.UID != uid && !currentUser.Admin {
		ab.Fail(r, http.StatusForbidden, nil)
	}

	entity.Updated = time.Now()
	entity.Revision = ""
}

func beforeWalkthroughDeleteHandler() (_loadFunc func(ab.DB, string) (*Walkthrough, error)) {
	return LoadActualRevision
}

func insideWalkthroughDeleteHandler(r *http.Request, entity *Walkthrough, db ab.DB) {
	uid := UserDelegate.CurrentUser(r)
	currentUser, err := LoadUser(db, uid)
	ab.MaybeFail(r, http.StatusBadRequest, err)
	if entity.UID != uid {
		if !currentUser.Admin {
			ab.Fail(r, http.StatusForbidden, nil)
		}
	}
}

func afterWalkthroughPostInsertHandler(db ab.DB, s *WalkthroughService, entity ab.Entity) {
	s.SearchService.IndexEntity("walkthrough", entity)

	wt := entity.(*Walkthrough)
	user, err := LoadUser(db, wt.UID)
	if err != nil {
		log.Println(err)
		return
	}
	startURL := ""
	if len(wt.Steps) > 0 && wt.Steps[0].Command == "open" {
		startURL = wt.Steps[0].Arg0
	}
	message := fmt.Sprintf("%s has recorded a Walkthrough (<%s|%s>) on %s",
		user.Mail,
		s.BaseURL+"walkthrough/"+wt.UUID,
		html.EscapeString(wt.Name),
		html.EscapeString(startURL),
	)
	DBLog(db, "walkthroughrecord", message)
}

func afterWalkthroughPutUpdateHandler(s *WalkthroughService, entity ab.Entity) {
	s.SearchService.IndexEntity("walkthrough", entity)
}

var _ search.SearchServiceDelegate = &walkhubSearchDelegate{}

type walkhubSearchDelegate struct {
	db ab.DB
}

func (d *walkhubSearchDelegate) IndexEntity(entity ab.Entity) []search.IndexData {
	wt := entity.(*Walkthrough)
	data := []search.IndexData{}

	data = append(data, search.IndexDataFromText("en", wt.Name, 0.7, wt.UID)...)
	data = append(data, search.IndexDataFromText("en", wt.Description, 0.2, wt.UID)...)
	if len(wt.Steps) > 0 && wt.Steps[0].Command == "open" {
		if u, err := url.Parse(wt.Steps[0].Arg0); err == nil {
			u.Scheme = ""
			if u.Path == "/" {
				u.Path = ""
			}
			fullurl := strings.TrimLeft(u.String(), "/")
			data = append(data, search.IndexData{
				Keyword:   fullurl,
				Relevance: 1.0,
				Owner:     wt.UID,
			})
			if fullurl != u.Host {
				data = append(data, search.IndexData{
					Keyword:   u.Host,
					Relevance: 0.9,
					Owner:     wt.UID,
				})
			}
		}
	}

	return data
}

func (d *walkhubSearchDelegate) LoadEntities(uuids []string) []ab.Entity {
	wts, err := LoadActualRevisions(d.db, uuids)
	if err != nil {
		log.Println(err)
		return []ab.Entity{}
	}

	ents := make([]ab.Entity, len(wts))
	for i, w := range wts {
		ents[i] = w
	}

	return ents
}
