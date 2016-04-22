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
import connectToStores from "alt/utils/connectToStores";
import UserStore from "stores/user";
import NotLoggedIn from "components/notloggedin";
import {noop} from "form";
import {popupWindowFeatures} from "util";
import {t} from "t";

@connectToStores
class LoggedIn extends React.Component {

	static contextTypes = {
		location: React.PropTypes.shape,
	};

	static getStores(props) {
		return [UserStore];
	}

	static getPropsFromStores() {
		const storeState = UserStore.getState();
		return {
			currentUser: storeState.users[storeState.currentUser] || {},
		};
	}

	static defaultProps = {
		color: "danger",
		label: t("Log in"),
		currentUser: {},
	};

	componentDidMount() {
		UserStore.performLoad(null);
	}

	render() {
		const embedded = !!this.context.location.query.embedded;

		const customLoginButtonClick = embedded ? (evt) => {
			noop(evt);
			const w = window.open("/connect?embedded=1", "loginWindow", popupWindowFeatures);
			const intervalID = setInterval(() => {
				if (w.closed) {
					clearInterval(intervalID);
					UserStore.performLoad(null);
					return;
				}

				if (w.location.pathname === "/") {
					w.close();
				}
			}, 250);
		} : null;

		return this.props.currentUser.UUID ?
			<div>{this.props.children}</div> :
			<NotLoggedIn color={this.props.color} label={this.props.label} customLoginButtonClick={customLoginButtonClick} />;
	}

}

export default LoggedIn;
