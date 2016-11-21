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

let Context = {
	MAXIMUM_ZINDEX: 2147483647,
	fullscreen: false,
	mobileBreakpoint: 479,
	protocolVersion: 2,
	iOS:
		window.navigator.platform === "iPad" ||
		window.navigator.platform === "iPad Simulator" ||
		window.navigator.platform === "iPhone" ||
		window.navigator.platform === "iPhone Simulator" ||
		window.navigator.platform === "iPod",
	isUnloading: function () {
		return !!Context.isUnloading.unloading;
	},
	start: function () {
		if (Context.start.started) {
			return;
		}

		window.addEventListener("beforeunload", function () {
			Context.isUnloading.unloading = true;
		});

		Context.start.started = true;
	},
	locatorTranslationCanWait: function () {
		return !Context.isUnloading() && !Context.iOS;
	}
};

export default Context;
