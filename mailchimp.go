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
	"bytes"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"net/http"

	"github.com/spf13/viper"
	"github.com/tamasd/ab"
	"github.com/tamasd/ab/lib/log"
)

var _ ab.EntityWriteEvent = &mailchimpClient{}

type mailchimpClient struct {
	token      string
	listid     string
	datacenter string
	logger     *log.Log
}

func createMailchimpClient(v *viper.Viper, logger *log.Log) *mailchimpClient {
	token := v.GetString("mailchimp.token")
	listid := v.GetString("mailchimp.listid")
	datacenter := v.GetString("mailchimp.datacenter")
	if token != "" && listid != "" && datacenter != "" {
		return &mailchimpClient{
			token:      token,
			listid:     listid,
			datacenter: datacenter,
			logger:     logger,
		}
	}

	return nil
}

func (c *mailchimpClient) subscribe(mail string) error {
	member := mailchimpMember{
		Status: "subscribed",
		Mail:   mail,
	}
	buf := bytes.NewBuffer(nil)
	if err := json.NewEncoder(buf).Encode(member); err != nil {
		return err
	}
	req, err := http.NewRequest("POST", "https://"+c.datacenter+".api.mailchimp.com/3.0/lists/"+c.listid+"/members", buf)
	if err != nil {
		return err
	}
	req.Header.Set("Content-Type", "application/json")
	req.SetBasicAuth("walkhub", c.token)

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := ioutil.ReadAll(resp.Body)
		return mailchimpError{
			Code:    resp.StatusCode,
			Message: string(body),
		}
	}

	return nil
}

func (c *mailchimpClient) Before(entityType string, e ab.Entity) {

}

func (c *mailchimpClient) After(entityType string, e ab.Entity, err error) error {
	if entityType == "user" && err == nil {
		user := e.(*User)
		if serr := c.subscribe(user.Mail); serr != nil {
			c.logger.User().Println(serr)
			if mcerr, ok := serr.(mailchimpError); ok {
				c.logger.Trace().Println(mcerr.Message)
			}
		}
	}
	return err
}

type mailchimpError struct {
	Code    int
	Message string
}

func (e mailchimpError) Error() string {
	return fmt.Sprintf("invalid status code: %d", e.Code)
}

type mailchimpMember struct {
	Status string `json:"status"`
	Mail   string `json:"email_address"`
}
