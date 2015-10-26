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

class Step extends React.Component {

	static defaultProps = {
		step: {},
	};

	render() {
		const step = this.props.step;
		const cmd = `${step.cmd}(${step.arg0 ? step.arg0 : ""}${step.arg1 ? ", " + step.arg1 : ""}; ${step.highlight})`;
		return (
			<div className="step">
				<div className="row">
					<div className="col-md-6 col-xs-12">{step.title}</div>
					<div className="col-md-6 col-xs-12">{cmd}</div>
				</div>
				<div className="row">
					<div className="col-xs-12">{step.description}</div>
				</div>
			</div>
		);
	}

}

export default Step;
