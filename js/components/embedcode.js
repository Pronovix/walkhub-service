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
import ReactDOM from "react-dom";
import {selectAll} from "util";

class EmbedCode extends React.Component {

	static defaultProps = {
		client: true,
		script: true,
		buttons: [{}],
		autoselect: false,
	};

	handleSelectEmbedCode(element, e) {
		if ((e.metaKey || e.ctrlKey) && e.keyCode === 65) {
			e.preventDefault();
			selectAll(element);
		}
	}

	render() {
		const origin = WALKHUB_URL;
		const clienturl = origin + "assets/client.js";
		const scripturl = origin + "assets/embed.js";

		let embedcode = "";
		if (this.props.client) {
			embedcode += `<script src="${clienturl}" defer></script>\n`;
		}
		if (this.props.script) {
			embedcode += `<script src="${scripturl}" defer></script>\n`;
		}
		if (this.props.buttons) {
			this.props.buttons.forEach((button) => {
				let uuid = null;

				const addData = (dict) => {
					return (name) => {
						if (name === "client" || name === "script" || name === "buttons" || name === "autoselect") {
							return;
						}

						if (name === "uuid") {
							uuid = dict[name];
						}

						const val = JSON.stringify(dict[name]);
						embedcode += ` data-${name}=${val}`;
					};
				};
				embedcode += `<a class="walkthroughbutton" data-origin="${WALKHUB_URL}"`;

				Object.keys(this.props).forEach(addData(this.props));
				Object.keys(button).forEach(addData(button));

				embedcode += ` href="` + WALKHUB_URL + (uuid ? `walkthrough/${uuid}` : "") + `"></a>\n`;
			});
		}

		return <pre ref="embedbox" className="walkthrough-embedcode">{embedcode}</pre>;
	}

	componentDidMount() {
		this.componentDidUpdate();
	}

	componentDidUpdate() {
		const element = ReactDOM.findDOMNode(this.refs.embedbox);
		if (this.props.autoselect) {
			selectAll(element);
		}

		window.addEventListener("keydown", this.handleSelectEmbedCode.bind(this, element));
	}

}

export default EmbedCode;
