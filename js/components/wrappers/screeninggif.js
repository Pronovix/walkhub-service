// Walkhub
// Copyright (C) 2016 Pronovix
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

class ScreeningGif extends React.Component {

	static defaultProps = {
		uuid: null,
		onClick: noop,
		onMouseEnter: noop,
		onMouseLeave: noop,
	};

	state = {
		show: true,
		loaded: false,
	};

	render() {
		return this.props.uuid && this.state.show ? (
			<div className="row screening-gif">
				<div className="col-xs-12 text-center">
					<img
						src={`/api/walkthrough/${this.props.uuid}/screening`}
						onLoad={this.onLoad}
						onError={this.onError}
						onClick={this.props.onClick}
						onMouseEnter={this.props.onMouseEnter}
						onMouseLeave={this.props.onMouseLeave}
					/>
				</div>
			</div>
		) : null;
	}

	onLoad = (evt) => {
		this.setState({
			loaded: true,
		});
	};

	onError = (evt) => {
		noop(evt);
		this.setState({
			show: false,
		});
	};

}

export default ScreeningGif;
