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

import axios from "axios";
import LogActions from "actions/log";

const LogSource = {
	performHelpCenterOpened: {
		remote(state, url) {
			return axios.post("/api/log/helpcenteropened", {
				url: url,
			});
		},
		local(state) {
			return null;
		},
		shouldFetch() {
			return true;
		},
		loading: LogActions.creatingLog,
		success: LogActions.createdLog,
		error: LogActions.creatingLogFailed,
	},
	performWalkthroughPlayed: {
		remote(state, uuid, errorMessage, embedOrigin) {
			return axios.post("/api/log/walkthroughplayed", {
				uuid: uuid,
				errorMessage: errorMessage,
				embedOrigin: embedOrigin,
			});
		},
		local(state) {
			return null;
		},
		shouldFetch() {
			return true;
		},
		loading: LogActions.creatingLog,
		success: LogActions.createdLog,
		error: LogActions.creatingLogFailed,
	},
	performWalkthroughPageVisited: {
		remote(state, uuid, embedOrigin) {
			return axios.post("/api/log/walkthroughpagevisited", {
				uuid: uuid,
				embedOrigin: embedOrigin,
			});
		},
		local(state) {
			return null;
		},
		shouldFetch() {
			return true;
		},
		loading: LogActions.creatingLog,
		success: LogActions.createdLog,
		error: LogActions.creatingLogFailed,
	},
};

export default LogSource;
