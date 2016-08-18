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
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"html"
	"log"
	"net/http"
	"net/url"
	"strings"
	"sync"
	"time"

	"github.com/pborman/uuid"
	"gitlab.com/tamasd/ab"
	"gitlab.com/tamasd/ab/services/search"
	"gitlab.com/tamasd/ab/util"
)

var WalkthroughNotFoundError = errors.New("walkthrough is not found")

func walkthroughService(ec *ab.EntityController, search *search.SearchService, baseurl string) ab.Service {
	h := &walkthroughEntityResourceHelper{
		controller: ec,
	}

	res := ab.EntityResource(ec, &Walkthrough{}, ab.EntityResourceConfig{
		PostMiddlewares:      []func(http.Handler) http.Handler{userLoggedInMiddleware},
		PutMiddlewares:       []func(http.Handler) http.Handler{userLoggedInMiddleware},
		DeleteMiddlewares:    []func(http.Handler) http.Handler{userLoggedInMiddleware},
		EntityResourceLister: h,
		EntityResourceLoader: h,
	})

	res.ExtraEndpoints = func(srv *ab.Server) error {
		reindexing := false
		var reindexingMutex sync.RWMutex
		srv.Post("/api/reindexwalkthroughs", http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			reindexingMutex.RLock()
			idxing := reindexing
			reindexingMutex.RUnlock()

			if idxing {
				ab.Fail(http.StatusServiceUnavailable, errors.New("reindexing is in progress"))
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
				err := search.PurgeIndex()
				if err != nil {
					log.Println(err)
					return
				}

				wts, err := LoadAllActualWalkthroughs(db, ec, 0, 0)
				if err != nil {
					log.Println(err)
					return
				}

				for _, wt := range wts {
					err = search.IndexEntity("walkthrough", wt)
					if err != nil {
						log.Println(err)
						return
					}
				}
			}()

			ab.Render(r).SetCode(http.StatusAccepted)
		}), ab.RestrictPrivateAddressMiddleware())

		srv.Get("/api/mysites", http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			db := ab.GetDB(r)
			uid := ab.GetSession(r)["uid"]

			rows, err := db.Query("SELECT DISTINCT steps->0->'arg0' AS site FROM walkthrough WHERE uid = $1 AND published ORDER BY site", uid)
			ab.MaybeFail(http.StatusInternalServerError, err)
			defer rows.Close()

			sites := []string{}

			for rows.Next() {
				var site sql.NullString
				err = rows.Scan(&site)
				ab.MaybeFail(http.StatusInternalServerError, err)
				if site.Valid {
					siteName := site.String

					// strip surrounding "
					siteName = siteName[1:]
					siteName = siteName[:len(siteName)-1]

					sites = append(sites, siteName)
				}
			}

			ab.Render(r).JSON(sites)
		}), userLoggedInMiddleware)

		return nil
	}

	res.AddPostEvent(ab.ResourceEventCallback{
		BeforeCallback: func(r *http.Request, d ab.Resource) {
			wt := d.(*Walkthrough)
			uid := UserDelegate.CurrentUser(r)
			if wt.UID == "" {
				wt.UID = uid
			}
			if wt.UID != uid {
				ab.Fail(http.StatusBadRequest, errors.New("invalid user id"))
			}

			wt.Updated = time.Now()
			wt.Revision = ""
			wt.UUID = ""
		},
		AfterCallback: func(r *http.Request, d ab.Resource) {
			db := ab.GetDB(r)
			wt := d.(*Walkthrough)
			search.IndexEntity("walkthrough", wt)
			userEntity, err := ec.Load(db, "user", wt.UID)
			if err != nil {
				log.Println(err)
				return
			}
			user := userEntity.(*User)
			startURL := ""
			if len(wt.Steps) > 0 && wt.Steps[0].Command == "open" {
				startURL = wt.Steps[0].Arg0
			}
			message := fmt.Sprintf("%s has recorded a Walkthrough (<%s|%s>) on %s",
				user.Mail,
				baseurl+"walkthrough/"+wt.UUID,
				html.EscapeString(wt.Name),
				html.EscapeString(startURL),
			)
			DBLog(db, ec, "walkthroughrecord", message)
		},
	})

	res.AddPutEvent(ab.ResourceEventCallback{
		BeforeCallback: func(r *http.Request, d ab.Resource) {
			db := ab.GetDB(r)
			wt := d.(*Walkthrough)
			uid := UserDelegate.CurrentUser(r)
			currentUserEntity, err := ec.Load(db, "user", uid)
			ab.MaybeFail(http.StatusBadRequest, err)
			currentUser := currentUserEntity.(*User)
			if wt.UID != uid {
				if !currentUser.Admin {
					ab.Fail(http.StatusForbidden, nil)
				}
			}

			previousRevision, err := LoadActualRevision(db, ec, wt.UUID)
			ab.MaybeFail(http.StatusBadRequest, err)
			if previousRevision == nil {
				ab.Fail(http.StatusNotFound, nil)
			}

			if previousRevision.UID != uid && !currentUser.Admin {
				ab.Fail(http.StatusForbidden, nil)
			}

			wt.Updated = time.Now()
			wt.Revision = ""
		},
		AfterCallback: func(r *http.Request, d ab.Resource) {
			search.IndexEntity("walkthrough", d.(*Walkthrough))
		},
	})

	res.AddDeleteEvent(ab.ResourceEventCallback{
		InsideCallback: func(r *http.Request, d ab.Resource) {
			db := ab.GetDB(r)
			uid := UserDelegate.CurrentUser(r)
			wt := d.(*Walkthrough)
			currentUserEntity, err := ec.Load(db, "user", uid)
			ab.MaybeFail(http.StatusBadRequest, err)
			currentUser := currentUserEntity.(*User)
			if wt.UID != uid {
				if !currentUser.Admin {
					ab.Fail(http.StatusForbidden, nil)
				}
			}
		},
	})

	return res
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
	Steps       []Step    `dbtype:"jsonb" json:"steps"`
	Updated     time.Time `json:"updated"`
	Published   bool      `json:"published"`
}

func (w *Walkthrough) GetID() string {
	return w.UUID
}

var _ ab.EntityDelegate = walkthroughEntityDelegate{}

type walkthroughEntityDelegate struct{}

func (d walkthroughEntityDelegate) Validate(e ab.Entity) error {
	wt := e.(*Walkthrough)

	if wt.Name == "" {
		return ab.NewVerboseError("", "name must not be empty")
	}

	if wt.UID == "" {
		return ab.NewVerboseError("", "uid must not be empty")
	}

	if len(wt.Steps) == 0 {
		return ab.NewVerboseError("", "a walkthrough must have at least one step")
	}

	return nil
}

func (d walkthroughEntityDelegate) AlterSQL(sql string) string {
	return sql + `
		ALTER TABLE walkthrough ADD CONSTRAINT walkthrough_uuid_fkey FOREIGN KEY (uid)
			REFERENCES "user" (uuid) MATCH SIMPLE
			ON UPDATE CASCADE ON DELETE CASCADE;

		CREATE INDEX walkthrough_site_idx
			ON public.walkthrough
			USING btree
			(((steps -> 0) ->> 'arg0'::text) COLLATE pg_catalog."default");

		CREATE INDEX walkthrough_published_idx
			ON public.walkthrough
			USING btree
			(published);
	`
}

func (e *Walkthrough) Insert(db ab.DB) error {
	if e.UUID == "" {
		e.UUID = uuid.NewRandom().String()
	}

	jsonSteps := ""

	bjsonSteps, _ := json.Marshal(e.Steps)
	jsonSteps = string(bjsonSteps)
	return db.QueryRow("INSERT INTO \"walkthrough\"(uuid, uid, name, description, steps, updated, published) VALUES($1, $2, $3, $4, $5, $6, $7) RETURNING revision", e.UUID, e.UID, e.Name, e.Description, jsonSteps, e.Updated, e.Published).Scan(&e.Revision)
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

var _ ab.EntityResourceLister = &walkthroughEntityResourceHelper{}

type walkthroughEntityResourceHelper struct {
	controller *ab.EntityController
}

func (h *walkthroughEntityResourceHelper) List(r *http.Request, start, limit int) (string, []interface{}) {
	walkthroughFields := h.controller.FieldList("walkthrough")
	if uid := r.URL.Query().Get("uid"); uid != "" {
		return `WITH
		latestwt AS (SELECT uuid, MAX(updated) u FROM walkthrough WHERE published = true GROUP BY uuid ORDER BY u DESC),
		latestuuid AS (SELECT w.revision FROM latestwt l JOIN walkthrough w ON l.uuid = w.uuid AND l.u = w.updated)
		SELECT ` + walkthroughFields + ` FROM walkthrough w JOIN latestuuid l ON l.revision = w.revision WHERE uid = $1 ORDER BY updated DESC`, []interface{}{uid}
	}

	return `WITH
	latestwt AS (SELECT uuid, MAX(updated) u FROM walkthrough WHERE published = true GROUP BY uuid ORDER BY u DESC),
	latestuuid AS (SELECT w.revision FROM latestwt l JOIN walkthrough w ON l.uuid = w.uuid AND l.u = w.updated)
	SELECT ` + walkthroughFields + ` FROM walkthrough w JOIN latestuuid l ON l.revision = w.revision ORDER BY updated DESC`, []interface{}{}
}

func LoadAllActualWalkthroughs(db ab.DB, ec *ab.EntityController, start, limit int) ([]*Walkthrough, error) {
	walkthroughFields := ec.FieldList("walkthrough")
	entities, err := ec.LoadFromQuery(db, "walkthrough", `WITH
	latestwt AS (SELECT uuid, MAX(updated) u FROM walkthrough WHERE published = true GROUP BY uuid ORDER BY u DESC),
	latestuuid AS (SELECT w.revision FROM latestwt l JOIN walkthrough w ON l.uuid = w.uuid AND l.u = w.updated)
	SELECT `+walkthroughFields+` FROM walkthrough w JOIN latestuuid l ON l.revision = w.revision ORDER BY updated DESC`)

	if err != nil {
		return []*Walkthrough{}, err
	}

	wts := make([]*Walkthrough, len(entities))
	for i, e := range entities {
		wts[i] = e.(*Walkthrough)
	}

	return wts, nil
}

func (h *walkthroughEntityResourceHelper) Load(id string, r *http.Request) (ab.Resource, error) {
	return LoadActualRevision(ab.GetDB(r), h.controller, id)
}

func LoadActualRevisions(db ab.DB, ec *ab.EntityController, uuids []string) ([]*Walkthrough, error) {
	walkthroughFields := ec.FieldList("walkthrough")
	placeholders := util.GeneratePlaceholders(1, uint(len(uuids))+1)
	entities, err := ec.LoadFromQuery(db, "walkthrough", `WITH
	latestwt AS (SELECT uuid, MAX(updated) u FROM walkthrough WHERE published = true GROUP BY uuid ORDER BY u DESC),
	latestuuid AS (SELECT w.revision FROM latestwt l JOIN walkthrough w ON l.uuid = w.uuid AND l.u = w.updated)
	SELECT `+walkthroughFields+` FROM walkthrough w JOIN latestuuid l ON l.revision = w.revision WHERE w.uuid IN (`+placeholders+`)
	`, util.StringSliceToInterfaceSlice(uuids)...)

	if err != nil {
		return []*Walkthrough{}, err
	}

	wts := make([]*Walkthrough, len(entities))
	for i, e := range entities {
		wts[i] = e.(*Walkthrough)
	}

	return wts, nil
}

func LoadActualRevision(db ab.DB, ec *ab.EntityController, UUID string) (*Walkthrough, error) {
	walkthroughFields := ec.FieldList("walkthrough")
	entities, err := ec.LoadFromQuery(db, "walkthrough", "SELECT "+walkthroughFields+" FROM walkthrough w WHERE UUID = $1 AND published = true ORDER BY Updated DESC LIMIT 1", UUID)

	if err != nil {
		return nil, err
	}

	if len(entities) != 1 {
		return nil, nil
	}

	return entities[0].(*Walkthrough), nil
}

var _ search.SearchServiceDelegate = &walkhubSearchDelegate{}

type walkhubSearchDelegate struct {
	controller *ab.EntityController
	db         ab.DB
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
	wts, err := LoadActualRevisions(d.db, d.controller, uuids)
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
