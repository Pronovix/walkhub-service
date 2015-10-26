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
import Router from "react-router";
import Routes from "routes";
import $ from "jquery";
import axios from "axios";
import RouterActions from "actions/router";
import WalkhubBackend from "walkhub_backend";

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

$(function() {
	$("html").removeClass("no-js").addClass("js");
});

Router.run(Routes, Router.HistoryLocation, (Root, state) => {
	RouterActions.changeRoute(state);
	React.render(<Root {...state} />, document.getElementById("content"));
});
