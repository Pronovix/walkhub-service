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

import {escapeHTML} from "util";

function isPlural(num) {
	return num > 1;
}

function replace(s, p, param_p) {
	if (p.indexOf("!") !== 0) {
		param_p = escapeHTML(param_p);
	}

	return s.replace(p, param_p);
}

export function t(str, params) {
	return params ? Object.keys(params).reduce((s, p) => {
		return replace(s, p, params[p]);
	}, str) : str;
};

export function pt(str, str_plural, num, params) {
	return isPlural(num) ?
		t(str_plural, params) :
		t(str, params);
};
