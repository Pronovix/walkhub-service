// Walkhub
// Copyright (C) 2016 Pronovix
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

import React from "react";
import Profile from "components/profile";
import ProfileEdit from "components/profileedit";
import PasswordChange from "components/passwordchange";
import connectToStores from "alt/utils/connectToStores";
import UserStore from "stores/user";
import AuthProviderStore from "stores/auth_provider";
import UserActions from "actions/user";
import {noop} from "form";
import flux from "control";

@connectToStores
class ProfileWrapper extends React.Component {

	static defaultProps = {
		params: {
			uuid: null,
		},
		currentUser: null,
		users: {},
		authProviders: {},
		has2fa: null,
	};

	static contextTypes = {
		location: React.PropTypes.shape,
		history: React.PropTypes.shape,
	};

	static getStores(props) {
		return [UserStore, AuthProviderStore];
	}

	static getPropsFromStores(props) {
		const userStoreState = UserStore.getState();
		const authProviderStoreState = AuthProviderStore.getState();

		return {
			users: userStoreState.users,
			has2fa: userStoreState.has2fa,
			currentUser: userStoreState.currentUser,
			authProviders: authProviderStoreState,
			userAuthProviders: userStoreState.authproviders,
		};
	}

	state = {
		changingPassword: false,
		oldPassword: "",
		newPassword: "",
		newPasswordConfirm: "",

		profileEditing: false,
		name: "",
		mail: "",

		enabling2fa: "",
		disabling2fa: "",
		token2fa: "",
		pw2fa: "",
	};

	refreshStores(props, reset) {
		const uuid = props.params.UUID === "me" ?
			props.currentUser :
			props.params.UUID;

		if (props.params.UUID !== "me") {
			UserStore.performLoad(props.params.UUID);
		}

		if (uuid && (!props.userAuthProviders[uuid] || reset)) {
			UserStore.performLoadUsersAuthProvider(uuid);
		}

		if (!props.authProviders.loaded) {
			AuthProviderStore.performLoad();
		}

		if (this.props.has2fa === null || reset) {
			UserStore.performHas2FA();
		}
	}

	dispatcherToken = null;

	componentDidMount() {
		this.refreshStores(this.props);
		this.dispatcherToken = flux.dispatcher.register(this.onChange);
	}

	componentWillUnmount() {
		if (this.dispatcherToken) {
			flux.dispatcher.unregister(this.dispatcherToken);
		}
	}

	componentWillReceiveProps(nextProps) {
		setTimeout(() => {
			this.refreshStores(nextProps);
		}, 0);
	}

	onChange = (event) => {
		switch (event.action) {
			case UserActions.CHANGED_PASSWORD:
				this.refreshStores(this.props, true);
				break;
		}
	};

	hasPassword() {
		try {
			const uuid = this.props.params.UUID === "me" ?
				this.props.currentUser :
				this.props.users[this.props.params.UUID].UUID;
			return this.props.userAuthProviders[uuid].filter((provider) => {
				return provider === "password";
			}).length > 0;
		} catch(e) {
			return true;
		}
	}

	getUser() {
		let user = null;
		if (this.props.params.UUID === "me") {
			user = this.props.users[this.props.currentUser];
		} else {
			user = this.props.users[this.props.params.UUID];
		}
		return user || {};
	}

	render() {
		const user = this.getUser();

		return (
			<Profile user={user} userAuthProviders={this.props.userAuthProviders} authProviders={this.props.authProviders} has2fa={this.props.has2fa}>
				<ProfileEdit
					editing={this.state.profileEditing}

					name={this.state.name}
					mail={this.state.mail}

					onNameChange={this.textChange("name")}
					onMailChange={this.textChange("mail")}
					editingToggleClick={this.editingToggleClick}
					onSubmit={this.onProfileSubmit}
					onResetClick={this.onProfileResetClick}
				/>
				<PasswordChange
					changingPassword={this.state.changingPassword}
					onToggleClick={this.onPasswordChangeToggleClick}

					has2fa={this.props.has2fa}
					hasPassword={this.hasPassword()}

					oldPassword={this.state.oldPassword}
					newPassword={this.state.newPassword}
					newPasswordConfirm={this.state.newPasswordConfirm}

					oldPasswordChange={this.textChange("oldPassword")}
					newPasswordChange={this.textChange("newPassword")}
					newPasswordConfirmChange={this.textChange("newPasswordConfirm")}

					onSubmit={this.onPasswordChangeSubmit}
					onResetClick={this.onPasswordChangeResetClick}

					enable2faClick={this.enable2faClick}
					disable2faClick={this.disable2faClick}

					enabling2fa={this.state.enabling2fa}
					disabling2fa={this.state.disabling2fa}

					token2fa={this.state.token2fa}
					token2faChange={this.textChange("token2fa")}
					pw2fa={this.state.pw2fa}
					pw2faChange={this.textChange("pw2fa")}

					enable2faSubmit={this.enable2faSubmit}
					enable2faReset={this.reset2fa}
					disable2faSubmit={this.disable2faSubmit}
					disable2faReset={this.reset2fa}
				/>
			</Profile>
		);
	}

	textChange = (field) => {
		return (event) => {
			noop(event);
			let newState = {};
			newState[field] = event.target.value;
			this.setState(newState);
		};
	};

	onPasswordChangeToggleClick = (event) => {
		noop(event);
		this.setState({
			changingPassword: true,
		});
	};

	onPasswordChangeSubmit = (event) => {
		noop(event);
		UserStore.performChangePassword({
			old_password: this.state.oldPassword,
			password: this.state.newPassword,
			password_confirm: this.state.newPasswordConfirm,
		});
		this.onPasswordChangeResetClick(event);
	};

	onPasswordChangeResetClick = (event) => {
		noop(event);
		this.setState({
			oldPassword: "",
			newPassword: "",
			newPasswordConfirm: "",
			changingPassword: false,
		});
	}

	editingToggleClick = (event) => {
		noop(event);
		const user = this.getUser();
		this.setState({
			profileEditing: true,
			name: user.Name,
			mail: user.Mail,
		});
	};

	onProfileResetClick = (event) => {
		noop(event);
		this.setState({
			profileEditing: false,
			name: "",
			mail: "",
		});
	};

	onProfileSubmit = (event) => {
		noop(event);
		const user = this.getUser();
		user.Name = this.state.name;
		user.Mail = this.state.mail;
		UserStore.performPut(user);
		this.onProfileResetClick();
	};

	enable2faClick = (event) => {
		noop(event);
		this.setState({
			enabling2fa: true,
			disabling2fa: false,
			token2fa: "",
			pw2fa: "",
		});
	};

	disable2faClick = (event) => {
		noop(event);
		this.setState({
			disabling2fa: true,
			enabling2fa: false,
			token2fa: "",
			pw2fa: "",
		});
	};

	enable2faSubmit = (event) => {
		noop(event);
		UserStore.performAdd2FA({
			token: this.state.token2fa,
		});
	};

	reset2fa = (event) => {
		noop(event);
		this.setState({
			disabling2fa: false,
			enabling2fa: false,
			token2fa: "",
			pw2fa: "",
		});
	};

	disable2faSubmit = (event) => {
		noop(event);
		UserStore.performDisable2FA({
			password: this.state.pw2fa,
		});
	};

}

export default ProfileWrapper;
