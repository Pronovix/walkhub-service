// Walkhub
// Copyright (C) 2016 Pronovix
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
	"bufio"
	"database/sql"
	"errors"
	"io"
	"net/http"
	"strings"
	"sync"
	"time"

	"github.com/tamasd/ab"
)

var timeoutError = errors.New("siteinfo wait timeout")

var _ ab.Service = &SiteinfoService{}

type SiteinfoService struct {
	inProgress map[string]chan struct{}
	mtx        sync.Mutex
	BaseURLs   []string
}

func NewSiteinfoService(baseurls ...string) *SiteinfoService {
	return &SiteinfoService{
		inProgress: make(map[string]chan struct{}),
		BaseURLs:   baseurls,
	}
}

func (sis *SiteinfoService) Register(srv *ab.Server) error {
	clientjs := make([]string, len(sis.BaseURLs))
	for i, baseurl := range sis.BaseURLs {
		clientjs[i] = getClientJS(baseurl)
	}
	srv.Post("/api/siteinfo", http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		d := siteInfoRequest{}
		ab.MustDecode(r, &d)
		db := ab.GetDB(r)

		info, err := sis.getFromDB(db, d.Url)
		ab.MaybeFail(http.StatusInternalServerError, err)

		if info.Empty() {
			info, err = sis.fetchAndSaveSiteinfo(db, d.Url, clientjs)
			if err != nil {
				if err == timeoutError {
					ab.Fail(http.StatusServiceUnavailable, err)
				} else {
					ab.Fail(http.StatusBadGateway, err)
				}
			}
			if info.Empty() {
				info, err = sis.getFromDB(db, d.Url)
				ab.MaybeFail(http.StatusInternalServerError, err)
			}
		}

		ab.Render(r).JSON(info)
	}))

	return nil
}

func (sis *SiteinfoService) SchemaInstalled(db ab.DB) bool {
	return ab.TableExists(db, "siteinfo")
}

func (sis *SiteinfoService) SchemaSQL() string {
	return `
		CREATE TABLE siteinfo (
			url character varying NOT NULL,
			created timestamp with time zone NOT NULL DEFAULT now(),
			blocks_iframe boolean NOT NULL,
			has_embed_code boolean NOT NULL,
			CONSTRAINT siteinfo_pkey PRIMARY KEY (url, created)
		);

		CREATE INDEX siteinfo_url_idx
			ON public.siteinfo
			USING btree
			(url COLLATE pg_catalog."default");
	`
}

func (sis *SiteinfoService) getFromDB(db ab.DB, site string) (siteInfoResponse, error) {
	resp := siteInfoResponse{}

	if err := db.QueryRow("SELECT blocks_iframe, has_embed_code FROM siteinfo WHERE url = $1 AND created > (now() - '1 month'::interval)", site).Scan(&resp.BlocksIframe, &resp.HasEmbedCode); err != nil {
		if err == sql.ErrNoRows {
			return resp, nil
		}
		return siteInfoResponse{}, err
	}

	resp.Url = site

	return resp, nil
}

func (sis *SiteinfoService) saveToDB(db ab.DB, resp siteInfoResponse) error {
	_, err := db.Exec(
		"INSERT INTO siteinfo(url, blocks_iframe, has_embed_code) VALUES($1, $2, $3)",
		resp.Url,
		resp.BlocksIframe,
		resp.HasEmbedCode,
	)
	return err
}

func (sis *SiteinfoService) fetchAndSaveSiteinfo(db ab.DB, url string, clientjs []string) (siteInfoResponse, error) {
	sis.mtx.Lock()
	ch, inProgress := sis.inProgress[url]
	if !inProgress {
		ch = make(chan struct{})
		sis.inProgress[url] = ch
	}
	sis.mtx.Unlock()

	if inProgress {
		select {
		case <-ch:
			return sis.getFromDB(db, url)
		case <-time.After(10 * time.Second):
			return siteInfoResponse{}, timeoutError
		}
	} else {
		info, err := fetchSiteinfo(url, clientjs)
		defer func() {
			sis.mtx.Lock()
			delete(sis.inProgress, url)
			sis.mtx.Unlock()
		}()
		if err != nil {
			return siteInfoResponse{}, err
		}
		if err = sis.saveToDB(db, info); err != nil {
			return siteInfoResponse{}, err
		}

		return info, nil
	}
}

type siteInfoRequest struct {
	Url string `json:"url"`
}

type siteInfoResponse struct {
	Url          string `json:"url"`
	BlocksIframe bool   `json:"blocks_iframe"`
	HasEmbedCode bool   `json:"has_embed_code"`
}

func (sir siteInfoResponse) Empty() bool {
	return sir.Url == ""
}

func fetchSiteinfo(url string, clientjs []string) (siteInfoResponse, error) {
	resp, err := http.Get(url)
	if err != nil {
		return siteInfoResponse{}, err
	}
	defer resp.Body.Close()

	return siteInfoResponse{
		Url:          url,
		BlocksIframe: blocksIframe(resp.Header),
		HasEmbedCode: hasEmbedCode(resp.Body, clientjs),
	}, nil
}

func blocksIframe(h http.Header) bool {
	if xfo := strings.ToLower(h.Get("X-Frame-Options")); strings.Contains(xfo, "deny") || strings.Contains(xfo, "sameorigin") {
		return true
	}
	if cspHeader := getCSPHeader(h); cspHeader != "" {
		csp := parseCSPHeader(cspHeader)
		if fa, ok := csp["frame-ancestors"]; ok {
			for _, p := range fa {
				if p == "*" {
					return false
				}
				// TODO check for the https and http domains
			}
			return true
		}
	}
	return false
}

func hasEmbedCode(body io.Reader, clientjs []string) bool {
	lbody := io.LimitReader(body, 1024*1024)
	sbody := bufio.NewScanner(lbody)
	for sbody.Scan() {
		line := sbody.Text()
		for _, cjs := range clientjs {
			if strings.Contains(line, cjs) {
				return true
			}
		}
	}
	return false
}

func getCSPHeader(h http.Header) string {
	headers := []string{
		"Content-Security-Policy",
		"X-Content-Security-Policy",
		"X-Webkit-CSP",
	}

	for _, header := range headers {
		if v := h.Get(header); v != "" {
			return v
		}
	}

	return ""
}

func parseCSPHeader(header string) map[string][]string {
	parts := strings.Split(header, ";")

	directives := map[string][]string{}

	for _, part := range parts {
		part = strings.TrimSpace(part)
		pieces := strings.Split(part, " ")
		for i, p := range pieces {
			pieces[i] = strings.ToLower(p)
		}
		if len(pieces) == 0 {
			continue
		}
		if len(pieces) == 1 {
			directives[pieces[0]] = []string{}
		} else {
			directives[pieces[0]] = pieces[1:]
		}
	}

	return directives
}

func getClientJS(baseurl string) string {
	i := strings.Index(baseurl, ":")
	if i != -1 {
		baseurl = baseurl[i+1:]
	}

	return baseurl + "assets/client.js"
}
