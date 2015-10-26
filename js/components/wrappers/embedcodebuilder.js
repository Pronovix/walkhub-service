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
import EmbedCodeBuilder from "components/embedcodebuilder";
import EmbedLogStore from "stores/embedlog";
import {noop} from "form";
import {validURL} from "util";

class EmbedCodeBuilderWrapper extends React.Component {

	static contextTypes = {
		router: React.PropTypes.func.isRequired,
	};

	constructor(props) {
		super(props);
		this.state = {
			url: "",
			email: "",
			record: true,
			search: true,
			position: "bottom-right",
			showCode: false,
			showAdvanced: false,
			urlHasError: false,
		};
	}

	urlChange = (evt) => {
		if (!this.state.showCode) {
			this.setState({url: evt.target.value});
		}
	};

	emailChange = (evt) => {
		if (!this.state.showCode) {
			this.setState({email: evt.target.value});
		}
	};

	positionChange = (evt) => {
		this.setState({position: evt.target.value});
	};

	recordCheck = (evt) => {
		this.setState({record: !this.state.record});
	};

	searchCheck = (evt) => {
		this.setState({search: !this.state.search});
	};

	generateClick = (evt) => {
		noop(evt);
		if (this.state.url && validURL(this.state.url)) {
			this.setState({
				showCode: true,
				urlHasError: false,
			});
			EmbedLogStore.performPost({
				site: this.state.url,
				mail: this.state.email,
			});
		} else {
			this.setState({urlHasError: true});
		}
	};

	advancedClick = (evt) => {
		noop(evt);
		this.setState({showAdvanced: true});
	};

	render() {
		return (
			<EmbedCodeBuilder
				url={this.state.url}
				email={this.state.email}
				record={this.state.record}
				search={this.state.search}
				position={this.state.position}
				showCode={this.state.showCode}
				showAdvanced={this.state.showAdvanced}
				enableAdvanced={true}
				generateClick={this.generateClick}
				advancedClick={this.advancedClick}
				urlChange={this.urlChange}
				emailChange={this.emailChange}
				positionChange={this.positionChange}
				recordCheck={this.recordCheck}
				searchCheck={this.searchCheck}
				urlHasError={this.state.urlHasError}
			/>
		);
	}

}

export default EmbedCodeBuilderWrapper;
