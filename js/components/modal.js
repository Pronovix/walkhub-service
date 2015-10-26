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
import MAXIMUM_ZINDEX from "util";

class Modal extends React.Component {

	state = {
		width: window.innerWidth,
		height: window.innerHeight,
	}

	render() {
		const style = {
			width: `${this.state.width}px`,
			height: `${this.state.height}px`,
		};
		return (
			<div className="wh-modal" style={style}>{this.props.children || " "}</div>
		);
	}

	resize = (evt) => {
		this.setState({
			width: window.innerWidth,
			height: window.innerHeight,
		});
	};

	componentDidMount() {
		window.addEventListener("resize", this.resize);
	}

	componentWillUnmount() {
		window.removeEventListener("resize", this.resize);
	}
}

export default Modal;
