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
import {selectAll} from "util";

class EmbedCode extends React.Component {

	static defaultProps = {
		client: true,
		script: true,
		buttons: [{}],
		autoselect: false,
	};

	render() {
		const origin = WALKHUB_EMBED_URL || WALKHUB_URL;
		const clienturl = origin + "assets/client.js";
		const scripturl = origin + "assets/embed.js";

		let embedcode = "";
		if (this.props.client) {
			embedcode += `<script src="${clienturl}"></script>\n`;
		}
		if (this.props.script) {
			embedcode += `<script src="${scripturl}"></script>\n`;
		}
		if (this.props.buttons) {
			this.props.buttons.forEach((button) => {
				const addData = (dict) => {
					return (name) => {
						if (name === "client" || name === "script" || name === "buttons" || name === "autoselect") {
							return;
						}
						const val = JSON.stringify(dict[name]);
						embedcode += ` data-${name}=${val}`;
					};
				};
				embedcode += `<div class="walkthroughbutton" data-origin="${WALKHUB_URL}"`;

				Object.keys(this.props).forEach(addData(this.props));
				Object.keys(button).forEach(addData(button));

				embedcode += `></div>\n`;
			});
		}

		return <pre ref="embedbox" className="walkthrough-embedcode">{embedcode}</pre>;
	}

	componentDidMount() {
		this.componentDidUpdate();
	}

	componentDidUpdate() {
		if (this.props.autoselect) {
			const element = React.findDOMNode(this.refs.embedbox);
			selectAll(element);
		}
	}

}

export default EmbedCode;
