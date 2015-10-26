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

class WalkthroughItem extends React.Component {

	static defaultProps = {
		walkthrough: {},
		linkTo: true,
		showDescription: true,
	};

	render() {
		const title = this.props.linkTo ?
			<h2> <Link to="walkthrough" params={{uuid: this.props.walkthrough.uuid}}>{this.props.walkthrough.name}</Link> </h2> :
			<h3> {this.props.walkthrough.name} </h3>;

		const description = this.props.showDescription ?
			<p> {this.props.walkthrough.description} </p> :
			null;

		return (
			<div className="row">
				<div className="col-xs-12">
					{title}
					{description}
				</div>
			</div>
		);
	}

}

export default WalkthroughItem;
