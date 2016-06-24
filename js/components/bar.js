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
import {noop} from "form";
import {t} from "t";

class Bar extends React.Component {

	static defaultProps = {
		actionButton: null,
		actionButtonClassName: "",
		onActionButtonClick: noop,
		brand: "",
		inverse: false,
		onClose: noop,
		footer: false,
		helpcenter: false,
	};

	render() {
		const btn = this.props.actionButton ?
			<li><a href="#" onClick={this.props.onActionButtonClick} className={"btn " + this.props.actionButtonClassName}><strong>{this.props.actionButton}</strong></a></li> :
			" ";

		const navbarClass = this.props.inverse ? "navbar navbar-inverse" : (
			this.props.helpcenter ? "navbar navbar-default navbar-fixed-top navbar-record" : "navbar navbar-default navbar-record"
			);

		if (!this.props.footer) {
			return (
				<nav className={navbarClass} id={this.props.helpcenter ? "widget-navbar" : ""}>
					<div className="navbar-header">
						<span className="navbar-brand">{this.props.brand}</span>
					</div>
					<div>
						<ul className="nav navbar-nav navbar-right">
							{btn}
							{this.props.children}
							<li>
								<a href="#" onClick={this.props.onClose} className="btn btn-close" ariaLabel={t("Close")}>
									<strong><span className="glyphicon glyphicon-remove" ariaHidden="true"></span></strong>
								</a>
							</li>
						</ul>
					</div>
				</nav>
			);
		} else {
			return (
				<nav className="navbar navbar-default navbar-fixed-bottom navbar-footer" id="widget-footer">
					<div className="container-fluid">
						<div>
							<ul className="nav navbar-nav navbar-right">
									<li>Powered by <a target="_blank" href="http://embedthedocs.com/"><strong className="semi-bold">WalkHub Help Widget</strong></a> a <a target="_blank" href="http://pronovix.com"><strong>Pronovix</strong></a> product</li>
							</ul>
						</div>
					</div>
				</nav>
			);
		}

	}

}

export default Bar;
