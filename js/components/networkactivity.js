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

import loading from "images/loading.gif";

const SIZE = 198;

class NetworkActivity extends React.Component {

	state = {
		width: window.innerWidth,
		height: window.innerHeight,
	};

	render() {
		const style = {
			top: (this.state.height/2 - SIZE/2)+"px",
			left: (this.state.width/2 - SIZE/2)+"px",
			width: SIZE,
			height: SIZE,
		};
		return (
			<img src={loading} style={style} className="loadingicon" />
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

export default NetworkActivity;
