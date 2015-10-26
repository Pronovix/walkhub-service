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
import {Link} from "react-router";
import {csrfToken} from "util";
import {t} from "t";

class Navbar extends React.Component {

	static defaultProps = {
		loggedin: false
	}

	render() {
		const loggedin = this.props.loggedin;
		const logoutUrl = `/api/auth/logout?token=${csrfToken}`;
		const loginlogout = loggedin ?
			<a href={logoutUrl}>{t("Logout")}</a> :
			<Link to="connect">{t("Connect")}</Link>;
		const recordLink = loggedin ?
			<li><Link to="record">{t("Record")}</Link></li> :
			null;

		return (
			<nav className="navbar navbar-inverse">
				<div className="container-fluid">
					<div className="navbar-header">
						<ul className="nav navbar-nav">
							<li><Link to="frontpage" className="navbar-brand">WalkHub</Link></li>
							<li><a target="_blank" href="https://github.com/Pronovix/walkhub-service">{t("Download from GitHub")}</a></li>
						</ul>
					</div>
					<div className="collapse navbar-collapse">
						<ul className="nav navbar-nav navbar-right">
							<li><Link to="search">{t("Search")}</Link></li>
							{recordLink}
							<li>{loginlogout}</li>
						</ul>
					</div>
				</div>
			</nav>
		);
	}

}

export default Navbar;
