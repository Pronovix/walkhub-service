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

import React from "react";
import {render} from "react-dom";
import {Router} from "react-router";
import Routes from "routes";
import createBrowserHistory from "history/lib/createBrowserHistory";
import $ from "jquery";
import axios from "axios";
import RouterActions from "actions/router";
import WalkhubBackend from "walkhub_backend";
import Enforcer from "client/walkthrough/enforcer";
import cookies from "axios/lib/helpers/cookies";
import {isStandardBrowserEnv} from "axios/lib/utils";
import urlIsSameOrigin from "axios/lib/helpers/urlIsSameOrigin";
import {t} from "t";
import NetworkActivityActions from "actions/networkactivity";
import {startGoogleAnalytics} from "util";

let history = createBrowserHistory();

axios.defaults.xsrfCookieName = "WALKHUB_CSRF";
axios.defaults.xsrfHeaderName = "X-CSRF-Token";
axios.defaults.headers.common = {
	"Accept": "application/json",
};
axios.defaults.headers.post = {
	"Content-Type": "application/json",
};
axios.defaults.headers.put = {
	"Content-Type": "application/json",
};
axios.defaults.withCredentials = true;

const xsrfValue = cookies.read(axios.defaults.xsrfCookieName);

axios.interceptors.request.use(function(config) {
	if (config.url[0] === "/") {
		config.url = WALKHUB_URL + config.url.slice(1);
	}

	// Hack to send CSRF tokens with CORS.
	if (isStandardBrowserEnv()) {
		if (!urlIsSameOrigin(config.url)) {
			if (xsrfValue) {
				config.headers[axios.defaults.xsrfHeaderName] = xsrfValue;
			}
		}
	}

	return config;
});

axios.defaults.transformRequest.push(function(data) {
	setTimeout(() => {
		NetworkActivityActions.activityStarted();
	}, 0);
	return data;
});

axios.defaults.transformResponse.push(function(data) {
	setTimeout(() => {
		NetworkActivityActions.activityEnded();
	}, 0);
	return data;
});

$(function() {
	$("html").removeClass("no-js").addClass("js");
	Enforcer();
});

const el = document.getElementById("content");

if (xsrfValue) {
	render(<Router history={history}>{Routes}</Router>, el);
} else {
	render((
		<div className="alert alert-danger nocookie">
			{t("Allow cookies in your browser to be able to use WalkHub.")}
		</div>
	), el);
}

if (GA_ACCOUNT) {
	startGoogleAnalytics(GA_ACCOUNT);
}
