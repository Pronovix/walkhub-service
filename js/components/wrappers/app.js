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
import App from "components/app";
import CurrentUserStore from "stores/currentuser";
import UserActions from "actions/user";
import connectToStores from "alt/utils/connectToStores";
import flux from "control";
import {noop} from "form";
import {t} from "t";
import {capitalizeFirstLetter} from "util";
import RouterActions from "actions/router";
import WalkhubBackend from "walkhub_backend";
import $ from "jquery";

let menuItems = {
	navbar: {
		left: [
			{path: "https://github.com/Pronovix/walkhub-service", label: "Download from GitHub"},
		],
		right: [
			{path: "/search", label: "Search"},
			{path: "/record", label: "Record", loggedin: true},
			{path: "/connect", icon: "log-in", loggedin: false},
			{path: "/api/auth/logout?token=CSRF_TOKEN", icon: "log-out", loggedin: true},
		],
	},
	footer: {
		left: [
		],
		right: [
		],
	},
};

if (WALKHUB_MENU_ITEMS) {
	menuItems = require("MENU_ITEMS");
}

@connectToStores
class AppWrapper extends React.Component {

	static getStores(props) {
		return [CurrentUserStore];
	}

	static getPropsFromStores() {
		var storeState = CurrentUserStore.getState();
		return {
			currentUser: storeState.users[null] ? storeState.users[null] : {}
		};
	}

	static contextTypes = {
		location: React.PropTypes.shape,
	};

	state = {
		messages: [],
	}

	dispatcherToken = null;

	componentDidMount() {
		CurrentUserStore.performLoad();
		this.dispatcherToken = flux.dispatcher.register(this.onChange);
	}

	componentWillUnmount() {
		if (this.dispatcherToken) {
			flux.dispatcher.unregister(this.dispatcherToken);
		}
	}

	onChange = (event) => {
		// handle messages

		// error, failed
		const messages = this.state.messages;
		if (event.action.match(/(error|fail)/i)) {
			if (event.data && event.data.status && !(event.data.config.method === "get" && event.data.config.url === "/api/user")) { // Network error, but not related to the current user.
				messages.push({
					type: "danger",
					message: t(capitalizeFirstLetter(event.data.data.message)),
					key: Math.random().toString(),
				});
				$("html, body").animate({scrollTop: 0}, "slow");
			}
		}

		this.setState({messages: messages});
	};

	onMessageClose = (evt) => {
		noop(evt);
		const key = evt.target.dataset.key;
		const messages = this.state.messages.filter(function(msg) {
			return msg.key !== key;
		});

		this.setState({messages: messages});
	};

	render() {
		return (
			<App
				currentUser={this.props.currentUser}
				embedded={!!this.context.location.query.embedded}
				messages={this.state.messages}
				onMessageClose={this.onMessageClose}
				navbarConfig={menuItems.navbar}
				footerConfig={menuItems.footer}
				>
				{this.props.children}
			</App>
		);
	}

}

export default AppWrapper;
