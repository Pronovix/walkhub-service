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
import {t} from "t";
import {Link} from "react-router";

import loginIcon from "images/login.svg";

class NotLoggedIn extends React.Component {

	static defaultProps = {
		customLoginButtonClick: null,
		label: t("Log in"),
		color: "danger",
	};

	render() {
		const loginClass = "btn btn-"+this.props.color+" login-button";
		const loginSpan = <span><object className="login-icon" type="image/svg+xml" data={loginIcon}></object></span>;
		const loginButton = this.props.customLoginButtonClick ?
			<a href="#" className={loginClass} onClick={this.props.customLoginButtonClick} title={this.props.label}>{loginSpan}</a>:
			<Link to="/connect" className={loginClass} title={this.props.label}>{loginSpan}</Link>;
		return (
			<div className="row">
				<div className="col-xs-12">
					{loginButton}
				</div>
			</div>
		);
	}

}

export default NotLoggedIn;
