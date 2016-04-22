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
import UserActions from "actions/user";

const UserSource = {
	performLoad: {
		remote(state, uuid) {
			return axios.get(uuid ? `/api/user/${uuid}` : `/api/user`);
		},
		local(state, uuid) {
			if (uuid === null) {
				return null;
			}

			return state.users[uuid] ? state.users[uuid] : null;
		},
		loading: UserActions.loadingUser,
		success: UserActions.receivedUser,
		error: UserActions.fetchingUserFailed,
	},
	performPut: {
		remote(state, user) {
			return axios.put(`/api/user/${user.UUID}`, user);
		},
		local(state, user) {
			return null;
		},
		shouldFetch() {
			return true;
		},
		loading: UserActions.updatingUser,
		success: UserActions.updatedUser,
		error: UserActions.updatingUserFailed,
	},
	performRegister: {
		remote(state, data) {
			return axios.post(`/api/auth/password/register`, data);
		},
		local(state, user) {
			return null;
		},
		shouldFetch() {
			return true;
		},
		loading: UserActions.registeringUser,
		success: UserActions.registeredUser,
		error: UserActions.registeringUserFailed,
	},
	performLogin: {
		remote(state, data) {
			return axios.post(`/api/auth/password/login`, data);
		},
		local(state, user) {
			return null;
		},
		shouldFetch() {
			return true;
		},
		loading: UserActions.logginginUser,
		success: UserActions.loggedinUser,
		error: UserActions.logginginUserFailed,
	},
	performSecondFactorLogin: {
		remote(state, data) {
			return axios.post(`/api/auth/password/2fa`, data);
		},
		local(state, user) {
			return null;
		},
		shouldFetch() {
			return true;
		},
		loading: UserActions.logginginSecondFactorUser,
		success: UserActions.loggedinSecondFactorUser,
		error: UserActions.loggingInSecondFactorUserFailed,
	},
	performHas2FA: {
		remote(state) {
			return axios.get(`/api/auth/password/has2fa`);
		},
		local(state) {
			return state.has2fa;
		},
		shouldFetch(state) {
			return state.has2fa === null;
		},
		loading: UserActions.loadingHas2fa,
		success: UserActions.loadedHas2fa,
		error: UserActions.loadingHas2faFailed,
	},
	performAdd2FA: {
		remote(state, data) {
			return axios.post(`/api/auth/password/add2fa`, data);
		},
		local(state, data) {
			return null;
		},
		shouldFetch() {
			return true;
		},
		loading: UserActions.adding2fa,
		success: UserActions.added2fa,
		error: UserActions.loading2faFailed,
	},
	performDisable2FA: {
		remote(state, data) {
			return axios.post(`/api/auth/password/disable2fa`, data);
		},
		local(state, data) {
			return null;
		},
		shouldFetch() {
			return true;
		},
		loading: UserActions.disabling2fa,
		success: UserActions.disabled2fa,
		error: UserActions.disabling2faFailed,
	},
	performChangePassword: {
		remote(state, data) {
			return axios.post(`/api/auth/password/changepassword`, data);
		},
		local(state, data) {
			return null;
		},
		shouldFetch() {
			return true;
		},
		loading: UserActions.changingPassword,
		success: UserActions.changedPassword,
		error: UserActions.changingPasswordFailed,
	},
	performRequestLostPassword: {
		remote(state, data) {
			return axios.post(`/api/auth/password/lostpassword`, data);
		},
		local(state, data) {
			return null;
		},
		shouldFetch() {
			return true;
		},
		loading: UserActions.requestingLostPassword,
		success: UserActions.requestedLostPassword,
		error: UserActions.requestingLostPasswordFailed,
	},
	performLoadUsersAuthProvider: {
		remote(state, uuid) {
			return axios.get(`/api/providers/auth/${uuid}`);
		},
		local(state, uuid) {
			return state.authproviders[uuid];
		},
		loading: UserActions.loadingUsersAuthProvider,
		success: UserActions.receivedUsersAuthProvider,
		error: UserActions.fetchingUsersAuthProviderFailed,
	},
};

export default UserSource;
