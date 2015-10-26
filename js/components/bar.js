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
	};

	render() {
		const btn = this.props.actionButton ?
			<li><a href="#" onClick={this.props.onActionButtonClick} className={"btn " + this.props.actionButtonClassName}>{this.props.actionButton}</a></li> :
			" ";

		const navbarClass = this.props.inverse ? "navbar navbar-inverse" : "navbar navbar-default";

		return (
			<nav className={navbarClass}>
				<div className="navbar-header">
					<span className="navbar-brand">{this.props.brand}</span>
				</div>
				<div className="collapse navbar-collapse">
					<ul className="nav navbar-nav navbar-right">
						{btn}
						{this.props.children}
						<li>
							<a href="#" onClick={this.props.onClose} className="btn btn-danger" ariaLabel={t("Close")}>
								<span className="glyphicon glyphicon-remove" ariaHidden="true"></span>
							</a>
						</li>
					</ul>
				</div>
			</nav>
		);
	}

}

export default Bar;
