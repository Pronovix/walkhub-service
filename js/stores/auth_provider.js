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
import AuthProviderActions from "actions/auth_provider";
import AuthProviderSource from "sources/auth_provider";

@createStore(flux)
class AuthProviderStore {
	constructor() {
		this.state = {
			providers: [],
			loaded: false,
			users: {},
		};
		this.registerAsync(AuthProviderSource);
	}

	@bind(AuthProviderActions.receivedAuthProvider)
	receivedAuthProvider(result) {
		this.state.providers = result.data;
		this.state.loaded = true;
	}

	@bind(AuthProviderActions.loadAuthProvider)
	loadAuthProvider() {
		this.getInstance().performLoad();
	}
}

export default AuthProviderStore;
