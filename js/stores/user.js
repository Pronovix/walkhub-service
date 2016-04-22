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

import flux from "control";
import {createStore, bind} from "alt/utils/decorators";
import UserActions from "actions/user";
import UserSource from "sources/user";

@createStore(flux)
class UserStore {
	constructor() {
		this.state = {
			users: {},
			has2fa: null,
			authproviders: {},
			currentUser: null,
		};

		this.registerAsync(UserSource);
	}

	@bind(UserActions.receivedUser)
	receivedUser(result) {
		const user = result.data;
		this.state.users[user.UUID] = user;
		if (result.config.url.match(/\/api\/user$/)) {
			this.state.currentUser = user.UUID;
		}
	}

	@bind(UserActions.updatedUser)
	updatedUser(result) {
		const user = result.data;
		this.state.users[user.UUID] = user;
	}

	@bind(UserActions.loadedHas2fa)
	loadedHas2fa(result) {
		this.state.has2fa = result.data.has2fa;
	}

	@bind(UserActions.receivedUsersAuthProvider)
	receivedUsersAuthProvider(result) {
		const uuid = result.config.url.split("/").slice(-1)[0];
		this.state.authproviders[uuid] = result.data;
	}

	@bind(UserActions.changedPassword)
	changedPassword(result) {
		this.state.authproviders = {};
		this.state.has2fa = null;
	}

	@bind(UserActions.added2fa)
	added2fa(result) {
		this.state.has2fa = true;
	}

	@bind(UserActions.disabled2fa)
	disabled2fa(result) {
		this.state.has2fa = false;
	};
}

export default UserStore;
