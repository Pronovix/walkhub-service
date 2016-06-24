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
import UserStore from "stores/user";
import UserActions from "actions/user";
import connectToStores from "alt/utils/connectToStores";
import flux from "control";
import {noop} from "form";
import {t} from "t";
import {capitalizeFirstLetter} from "util";
import RouterActions from "actions/router";
import OuterClassActions from "actions/outerclass";
import MessageActions from "actions/message";
import WalkhubBackend from "walkthrough/walkhub_backend";
import $ from "jquery";
import NetworkActivityWrapper from "components/wrappers/networkactivity";

let FooterComponent = null;

if (WALKHUB_CUSTOM_FOOTER) {
	FooterComponent = require("FOOTER");
}

let menuItems = {
	navbar: {
		left: [
			{path: "https://github.com/Pronovix/walkhub-service", label: "Download from GitHub"},
		],
		right: [
			{path: "/search", label: "Search"},
			{path: "/profile/me", label: "My Profile", loggedin: true},
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
		return [UserStore];
	}

	static getPropsFromStores() {
		const storeState = UserStore.getState();
		return {
			currentUser: storeState.users[storeState.currentUser] || {},
		};
	}

	static contextTypes = {
		location: React.PropTypes.shape,
		history: React.PropTypes.shape,
	};

	state = {
		messages: [],
		classes: {},
	}

	dispatcherToken = null;

	componentDidMount() {
		UserStore.performLoad(null);
		this.dispatcherToken = flux.dispatcher.register(this.onChange);
	}

	componentWillUnmount() {
		if (this.dispatcherToken) {
			flux.dispatcher.unregister(this.dispatcherToken);
		}
	}

	onChange = (event) => {
		const messages = this.state.messages;
		let classes = this.state.classes;

		// handle messages
		if (event.action === MessageActions.FLASH_MESSAGE) {
			messages.push({
				type: "success",
				message: event.data,
				key: Math.random().toString(),
			});
		}

		// error, failed
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

		if (event.action === OuterClassActions.CHANGE_OUTER_CLASSES) {
			Object.keys(event.data).map((k) => {
				const v = event.data[k];
				if (v) {
					classes[k] = v;
				} else {
					delete classes[k];
				}
			});
		}

		this.setState({
			messages: messages,
			classes: classes,
		});
	};

	onMessageClose = (evt) => {
		noop(evt);
		const key = evt.target.dataset.key;
		const messages = this.state.messages.filter(function(msg) {
			return msg.key !== key;
		});

		this.setState({messages: messages});
	};

	getContainerClassName() {
		const path = this.context.location.pathname;
		if (path === "/" || !path) {
			return "frontpage";
		}

		return path.split("/")[1];
	}

	render() {
		let className = "app";
		Object.keys(this.state.classes).map((k) => {
			className += ` ${k}-${this.state.classes[k]}`;
		});

		const footer = FooterComponent ? <FooterComponent /> : null;

		return (
			<App
				currentUser={this.props.currentUser}
				embedded={!!this.context.location.query.embedded}
				messages={this.state.messages}
				onMessageClose={this.onMessageClose}
				navbarConfig={menuItems.navbar}
				footerConfig={menuItems.footer}
				className={className}
				containerClassName={this.getContainerClassName()}
				footer={footer}
				>
				<NetworkActivityWrapper />
				{this.props.children}
			</App>
		);
	}

}

export default AppWrapper;
