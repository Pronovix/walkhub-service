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
			<a href={logoutUrl}><span className="glyphicon glyphicon-log-out" aria-hidden="true"></span></a> :
			<Link to="/connect"><span className="glyphicon glyphicon-log-in" aria-hidden="true"></span></Link>;
		const recordLink = loggedin ?
			<li><Link to="/record">{t("Record")}</Link></li> :
			null;

		return (
			<nav className="navbar navbar-inverse" role="navigation">
				<div className="container-fluid">
					<div className="navbar-header">
						<button type="button" className="navbar-toggle" data-toggle="collapse" data-target="#navbar-to-collapse">
							<span className="sr-only">Toggle navigation</span>
							<span className="icon-bar"></span>
							<span className="icon-bar"></span>
							<span className="icon-bar"></span>
						</button>
						<Link to="/" className="navbar-brand">WalkHub</Link>
					</div>
					<div className="collapse navbar-collapse" id="navbar-to-collapse">
						<ul className="nav navbar-nav">
							<li><a target="_blank" href="https://github.com/Pronovix/walkhub-service">{t("Download from GitHub")}</a></li>
						</ul>
						<ul className="nav navbar-nav navbar-right">
							<li><Link to="/search">{t("Search")}</Link></li>
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
