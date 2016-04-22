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

import flux from 'control';
import {createActions} from 'alt/utils/decorators';

@createActions(flux)
class UserActions {
	constructor() {
		this.generateActions(
			"loadingUser",
			"receivedUser",
			"fetchingUserFailed",

			"updatingUser",
			"updatedUser",
			"updatingUserFailed",

			"registeringUser",
			"registeredUser",
			"registeringUserFailed",

			"logginginUser",
			"loggedinUser",
			"logginginUserFailed",

			"logginginSecondFactorUser",
			"loggedinSecondFactorUser",
			"loggingInSecondFactorUserFailed",

			"loadingHas2fa",
			"loadedHas2fa",
			"loadingHas2faFailed",

			"adding2fa",
			"added2fa",
			"adding2faFailed",

			"disabling2fa",
			"disabled2fa",
			"disabling2faFailed",

			"changingPassword",
			"changedPassword",
			"changingPasswordFailed",

			"requestingLostPassword",
			"requestedLostPassword",
			"requestingLostPasswordFailed",

			"loadingUsersAuthProvider",
			"receivedUsersAuthProvider",
			"fetchingUsersAuthProviderFailed",

			"loadUser",
			"updateUser",
			"registerUser",
			"loginUser",
			"loginSecondFactorUser",
			"load2fa",
			"add2fa",
			"disable2fa",
			"changePassword",
			"lostPassword",
			"loadUsersAuthProvider"
		);
	}
}

export default UserActions;
