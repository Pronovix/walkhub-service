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
import Navbar from "components/navbar";
import ErrorBar from "components/errorbar";
import {noop} from "form";

class App extends React.Component {

	static defaultProps = {
		currentUser: {},
		messages: [],
		onMessageClose: noop,
		navbarConfig: {},
		footerConfig: {},
	};

	configEmpty(cfg) {
		if (Object.keys(cfg).length === 0) {
			return true;
		}

		if (cfg.left && cfg.left.length > 0) {
			return false;
		}

		if (cfg.right && cfg.right.length > 0) {
			return false;
		}

		if (cfg.header && cfg.header.length > 0) {
			return false;
		}

		return true;
	}

	render() {
		if (this.props.embedded) {
			return (
				<div className="embeddedapp">
					{this.props.children}
				</div>
			);
		}

		const navbar = this.configEmpty(this.props.navbarConfig) ? null :
			<Navbar hasHeader={true} config={this.props.navbarConfig} loggedin={!!this.props.currentUser.UUID} className="navbar-inverse" />;
		const footer = this.configEmpty(this.props.footerConfig) ? null :
				<Navbar config={this.props.footerConfig} loggedin={!!this.props.currentUser.UUID} className="navbar-default" />;

		return (
			<div>
				{navbar}
				<div className="container">
					<ErrorBar
						messages={this.props.messages}
						onMessageClose={this.props.onMessageClose}
					/>
					{this.props.children}
				</div>
				{footer}
			</div>
		);
	}

}

export default App;
