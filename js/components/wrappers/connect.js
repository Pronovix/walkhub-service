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

import React from "react";
import Connect from "components/connect";
import AuthProviderStore from "stores/auth_provider";
import AuthProviderActions from "actions/auth_provider";
import connectToStores from "alt/utils/connectToStores";
import flux from "control";
import {noop} from "form";
import UserActions from "actions/user";
import UserStore from "stores/user";
import MessageActions from "actions/message";
import {t} from "t";

@connectToStores
class ConnectWrapper extends React.Component {

	state = {
		signin: false,
		signin2fa: false,
		signinMail: "",
		signinPassword: "",
		signin2faToken: "",
		signupMail: "",
		signupPassword: "",
		signupPasswordConfirm: "",
		lostPassword: false,
		lostPasswordMail: "",
	};

	static contextTypes = {
		location: React.PropTypes.shape,
		history: React.PropTypes.shape,
	};

	static getStores(props) {
		return [AuthProviderStore];
	}

	static getPropsFromStores(props) {
		return AuthProviderStore.getState();
	}

	render() {
		let password = false;
		const providers = this.props.providers.filter((provider) => {
			if (provider.id === "password") {
				password = true;
				return false;
			}
			return true;
		});
		return <Connect
			providers={providers}
			password={password}
			signinMailChange={this.textChange("signinMail")}
			signinPasswordChange={this.textChange("signinPassword")}
			signinTokenChange={this.textChange("signin2faToken")}
			signupMailChange={this.textChange("signupMail")}
			signupPasswordChange={this.textChange("signupPassword")}
			signupPasswordConfirmChange={this.textChange("signupPasswordConfirm")}
			lostPasswordMailChange={this.textChange("lostPasswordMail")}
			signinClick={this.signinClick}
			signinSubmit={this.signinSubmit}
			signin2faSubmit={this.signin2faSubmit}
			signupSubmit={this.signupSubmit}
			lostPasswordClick={this.lostPasswordClick}
			lostPasswordSubmit={this.lostPasswordSubmit}
			{...this.state}
		/>;
	}

	textChange = (stateField) => {
		return (evt) => {
			let stateChange = {};
			stateChange[stateField] = evt.target.value;
			this.setState(stateChange);
		};
	};

	lostPasswordClick = (evt) => {
		noop(evt);
		this.setState({
			lostPassword: true,
			signin: false,
			lostPasswordMail: this.state.signinMail || this.state.signupMail,
		});
	};

	lostPasswordSubmit = (evt) => {
		noop(evt);
		UserStore.performRequestLostPassword({
			email: this.state.lostPasswordMail,
		});
	};

	signinClick = (evt) => {
		noop(evt);
		this.setState({
			signin: true,
			lostPassword: false,
		});
	};

	signinSubmit = (evt) => {
		noop(evt);
		UserStore.performLogin({
			identifier: this.state.signinMail,
			password: this.state.signinPassword,
		});
	};

	signin2faSubmit = (evt) => {
		noop(evt);
		UserStore.performSecondFactorLogin({
			token: this.state.signin2faToken,
		});
	};

	signupSubmit = (evt) => {
		noop(evt);
		if (this.state.signupPassword === "") {
			// TODO validate
			return;
		}
		if (this.state.signupPassword !== this.state.signupPasswordConfirm) {
			// TODO validate
			return;
		}

		UserStore.performRegister({
			mail: this.state.signupMail,
			password: this.state.signupPassword,
			password_confirm: this.state.signupPasswordConfirm,
		});
	};

	dispatcherToken = null;

	componentDidMount() {
		AuthProviderStore.performLoad();
		this.dispatcherToken = flux.dispatcher.register(this.onChange);
	}

	componentWillUnmount() {
		if (this.dispatcherToken) {
			flux.dispatcher.unregister(this.dispatcherToken);
		}
	}

	onChange = (event) => {
		switch (event.action) {
			case UserActions.REGISTERED_USER:
				setTimeout(() => {
					MessageActions.flashMessage(t("Verification email has been sent."));
					this.context.history.pushState(null, `/`);
				}, 0);
				break;
			case UserActions.LOGGEDIN_USER:
				if (event.data.status === 202) { // 2FA
					this.setState({
						signin2fa: true,
					});
					break;
				}
				// fallthrough
			case UserActions.LOGGEDIN_SECOND_FACTOR_USER:
				setTimeout(() => {
					UserStore.performLoad(null);
					this.context.history.pushState(null, `/`);
				}, 0);
				break;
			case UserActions.REQUESTED_LOST_PASSWORD:
				setTimeout(() => {
					MessageActions.flashMessage(t("Recovery email has been sent."));
					this.context.history.pushState(null, `/`);
				}, 0);
				break;
		}
	};

}

export default ConnectWrapper;
