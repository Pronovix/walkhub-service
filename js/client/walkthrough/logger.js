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


class Logger {

	constructor(client) {
		this.client = client;
		this.start_timestamp = null;
		this.stop_timestamp = null;
		this.walkthrough_logged = false;
	}

	startWalkthrough() {
		this.start_timestamp = new Date().getTime();
	}

	stopWalkthrough() {
		this.stop_timestamp = new Date().getTime();
	}

	getPlayMode(state) {
		if (state.HTTPProxyURL === "") {
			return "module";
		}

		return "proxy";
	}

	logResult(state, result, message) {
		if (this.walkthrough_logged) {
			return;
		}
		this.walkthrough_logged = true;

		this.stopWalkthrough();

		if (message === null) {
			message = "";
		}

		const play_result = {
			"uuid": state.walkthrough,
			"result": result,
			"error_message": message,
			"play_mode" : this.getPlayMode(state),
			"time": (this.stop_timestamp - this.start_timestamp),
			"parameters": state.parameters,
		};

		this.client.logResult(play_result);
	}

}

export default Logger;
