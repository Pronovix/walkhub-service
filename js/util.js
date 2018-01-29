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

import {t} from "t";
import URI from "urijs";

export const csrfToken = window.CSRF_TOKEN;

export function baseUrl() {
	const port = window.location.port ? ":"+window.location.port : "";
	return window.location.protocol + "//" + window.location.hostname + port + "/";
}

export function capitalizeFirstLetter(string) {
	return string ? (string.charAt(0).toUpperCase() + string.slice(1)) : "";
}

export const MAXIMUM_ZINDEX = 2147483647;

export const popupWindowFeatures = [
	"centerscreen=yes",
	"chrome=yes",
	"dialog=yes",
	"menubar=no",
	"toolbar=no",
	"location=yes",
	"personalbar=no",
	"status=no",
	"dependent=yes",
	"minimizable=no",
].join(",");

export function validURL(string) {
	try {
		URI(string);
		return true;
	} catch (ex) {
		return false;
	}
}

const entityMap = {
	"&": "&amp;",
	"<": "&lt;",
	">": "&gt;",
	'"': '&quot;',
	"'": '&#39;',
	"/": '&#x2F;'
};

export function escapeHTML(str) {
	return String(str).replace(/[&<>"'\/]/g, function(s) {
		return entityMap[s];
	});
}

export function selectAll(element) {
	element.focus();
	if (window.getSelection && document.createRange) {
		const range = document.createRange();
		range.selectNodeContents(element);
		const sel = window.getSelection();
		sel.removeAllRanges();
		sel.addRange(range);
	} else {
		const textRange = document.body.createTextRange();
		textRange.moveToElementText(element);
		textRange.select();
	}
};

export function isHTTPSPage() {
	return window.location.protocol.slice(0, -1) === "https";
};

export function startGoogleAnalytics(accountID) {
	(function(i,s,o,g,r,a,m){i["GoogleAnalyticsObject"]=r;i[r]=i[r]||function(){
	(i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
	m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
	})(window,document,"script","https://www.google-analytics.com/analytics.js","ga");

	ga("create", accountID, "auto");
	ga("send", "pageview");
};

export const getdata = window.location.search.substr(1).split("&").reduce(function (obj, str) {
	var arrstr = str.split("=");
	obj[arrstr.shift()] = arrstr.join("=");
	return obj;
}, {});

export function parseGoDate(datestr) {
	const matches = datestr.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})/);

	if (matches.length !== 7) {
		return null;
	}

	return {
		year: matches[1],
		month: matches[2],
		day: matches[3],
		hour: matches[4],
		minute: matches[5],
		second: matches[6],
	};
};

// Split is a proper implementation of string splitting.
//
// Unlike the stock implementation, this concatenates the
// remaining parts instead of cutting them off.
export function split(str, separator, limit = 0) {
	const parts = str.split(separator);
	if (limit > 0) {
		const limitedParts = parts.slice(0, limit-1);
		const otherParts = parts.slice(limit-1);
		limitedParts.push(otherParts.join(separator));

		return limitedParts;
	}

	return parts;
}
