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
import EmbedLogActions from "actions/embedlog";

const EmbedLogSource = {
	performPost: {
		remote(state, log) {
			return axios.post("/api/embedlog", log);
		},
		local(state) {
			return null;
		},
		shouldFetch() {
			return true;
		},
		loading: EmbedLogActions.creatingEmbedLog,
		success: EmbedLogActions.createdEmbedLog,
		error: EmbedLogActions.creatingEmbedLogFailed,
	},
};

export default EmbedLogSource;
