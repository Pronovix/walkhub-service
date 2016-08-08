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
	"errors"
	"fmt"
	"image"
	"image/color"
	"image/color/palette"
	"image/gif"
	"image/png"
	"io"
	"io/ioutil"
	"net/http"
	"os"
	"sync"
	"time"

	"github.com/nfnt/resize"
	"github.com/vincent-petithory/dataurl"
	"gitlab.com/tamasd/ab"
)

type Screening struct {
	UUID      string    `dbtype:"uuid" dbdefault:"uuid_generate_v4()" json:"uuid"`
	WID       string    `dbtype:"uuid" json:"wid"`
	UID       string    `dbtype:"uuid" json:"uid"`
	Steps     uint      `dbtype:"smallint" json:"steps"`
	Created   time.Time `dbdefault:"now()" json:"created"`
	Published bool      `json:"published"`
}

func (s *Screening) GetID() string {
	return s.UUID
}

func (s *Screening) GIFPath() string {
	return fmt.Sprintf("public/%s__%s.gif", s.WID, s.UUID)
}

func (s *Screening) ScreenshotPath(step uint) string {
	return fmt.Sprintf("public/%s__%s__%04d.png", s.WID, s.UUID, step)
}

func (s *Screening) createGIF(force bool) error {
	fn := s.GIFPath()
	if !force {
		if _, err := os.Stat(fn); err == nil {
			return nil
		}
	}

	outGIF := &gif.GIF{}
	for i := uint(0); i < s.Steps; i++ {
		f, err := os.Open(s.ScreenshotPath(i))
		if err != nil {
			return err
		}
		defer f.Close()

		img, err := png.Decode(f)
		if err != nil {
			return err
		}

		paletted := image2paletted(720, img)
		outGIF.Image = append(outGIF.Image, paletted)
		outGIF.Delay = append(outGIF.Delay, 100)
	}

	f, err := os.Create(fn)
	if err != nil {
		return err
	}
	defer f.Close()
	return gif.EncodeAll(f, outGIF)
}

func image2paletted(height uint, img image.Image) *image.Paletted {
	resimg := resize.Resize(0, height, img, resize.Bilinear)
	pal := color.Palette(palette.Plan9)

	paletted := image.NewPaletted(resimg.Bounds(), pal)

	for y := 0; y < resimg.Bounds().Size().Y; y++ {
		for x := 0; x < resimg.Bounds().Size().X; x++ {
			paletted.Set(x, y, resimg.At(x, y))
		}
	}

	return paletted
}

func LoadActualScreeningForWalkthrough(db ab.DB, ec *ab.EntityController, wid string) (*Screening, error) {
	screeningFields := ec.FieldList("screening")
	screenings, err := ec.LoadFromQuery(db, "screening", "SELECT "+screeningFields+" FROM screening s WHERE wid = $1 AND published = true ORDER BY created DESC LIMIT 1", wid)
	if err != nil {
		return nil, err
	}

	if len(screenings) != 1 {
		return nil, nil
	}

	return screenings[0].(*Screening), nil
}

func screeningService(ec *ab.EntityController) ab.Service {
	res := ab.EntityResource(ec, &Screening{}, ab.EntityResourceConfig{
		DisablePost:   true,
		DisableList:   true,
		DisableGet:    true,
		DisablePut:    true,
		DisableDelete: true,
	})

	res.ExtraEndpoints = func(srv *ab.Server) error {
		srv.Post("/api/walkthrough/:id/screening", http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			wid := ab.GetParams(r).ByName("id")
			data := []string{}
			ab.MustDecode(r, &data)

			db := ab.GetDB(r)
			uid := ab.GetSession(r)["uid"]

			userEntity, err := ec.Load(db, "user", uid)
			ab.MaybeFail(http.StatusInternalServerError, err)
			user := userEntity.(*User)

			wt, err := LoadActualRevision(db, ec, wid)
			ab.MaybeFail(http.StatusBadRequest, err)

			if wt.UID != uid && !user.Admin {
				ab.Fail(http.StatusForbidden, nil)
			}

			if len(data) == 0 || len(data) != len(wt.Steps)-1 {
				ab.Fail(http.StatusBadRequest, fmt.Errorf("got %d images, expected: %d", len(data), len(wt.Steps)-1))
			}

			screening := &Screening{
				WID:       wid,
				UID:       uid,
				Steps:     uint(len(wt.Steps) - 1),
				Created:   time.Now(),
				Published: true,
			}

			err = ec.Insert(db, screening)
			ab.MaybeFail(http.StatusInternalServerError, err)

			images := map[string][]byte{}
			for i, d := range data {
				if d == "" {
					continue
				}
				dataurl, err := dataurl.DecodeString(d)
				if err != nil {
					ab.LogTrace(r).Printf("data url error: %s", dataurl)
					ab.Fail(http.StatusBadRequest, err)
				}
				if dataurl.ContentType() != "image/png" {
					ab.Fail(http.StatusBadRequest, errors.New("not a png"))
				}
				fn := screening.ScreenshotPath(uint(i))
				images[fn] = dataurl.Data
			}

			for name, content := range images {
				if err := ioutil.WriteFile(name, content, 0644); err != nil {
					ab.LogUser(r).Println(err)
				}
			}

			ab.Render(r).
				SetCode(http.StatusCreated).
				JSON(screening)
		}), userLoggedInMiddleware)

		lock := map[string]chan struct{}{}
		var mtx sync.Mutex

		srv.Get("/api/walkthrough/:id/screening", http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			wid := ab.GetParams(r).ByName("id")
			db := ab.GetDB(r)

			screening, err := LoadActualScreeningForWalkthrough(db, ec, wid)
			ab.MaybeFail(http.StatusInternalServerError, err)
			if screening == nil {
				ab.Fail(http.StatusNotFound, nil)
			}

			fn := screening.GIFPath()

			reply := func() {
				filelist := make([]string, int(screening.Steps))
				for i := uint(0); i < screening.Steps; i++ {
					filelist[i] = "/" + screening.ScreenshotPath(i)
				}

				ab.Render(r).AddOffer("image/gif", func(w http.ResponseWriter) {
					f, err := os.Open(fn)
					ab.MaybeFail(http.StatusInternalServerError, err)
					defer f.Close()
					io.Copy(w, f)
				}).JSON(filelist)
			}

			if _, err := os.Stat(fn); err == nil {
				reply()
				return
			}

			mtx.Lock()
			l, ok := lock[fn]
			if ok {
				mtx.Unlock()
				select {
				case <-l:
					reply()
				case <-time.After(5 * time.Second):
					w.Header().Set("Retry-After", "30")
					ab.Render(r).SetCode(http.StatusServiceUnavailable)
				}
				return
			}
			l = make(chan struct{})
			lock[fn] = l
			mtx.Unlock()

			err = screening.createGIF(false)

			defer func() {
				mtx.Lock()
				delete(lock, fn)
				mtx.Unlock()
			}()

			ab.MaybeFail(http.StatusInternalServerError, err)
			close(l)
			reply()
		}))
		return nil
	}

	return res
}

func afterScreeningServiceRegister(srv *ab.Server) {
}
