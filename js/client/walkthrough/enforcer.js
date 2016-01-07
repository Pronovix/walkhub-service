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

import Walkhub from "client/walkhub";

function Enforcer(wh) {
	window.Walkhub = window.Walkhub || {};

	if (!wh) {
		wh = Walkhub.getInstance();
	}

	if (window.parent !== window && !window.Walkhub[WALKHUB_URL]) {
		window.Walkhub[WALKHUB_URL] = true;
		enforce(wh);
	}
}

function enforce(wh) {
	if (!enforce.tries) {
		enforce.tries = 0;
	}

	if (wh.initialized) {
		return;
	}

	if (window.document.readyState === "complete") {
		if (enforce.tries > 4 || enforce.tries == 0) {
			wh.currentExecutor.start();
		}
		enforce.tries++;
	}

	setTimeout(() => enforce(wh), 500);
};

export default Enforcer;
