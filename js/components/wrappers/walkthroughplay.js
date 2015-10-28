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
import WalkhubBackend from "walkhub_backend";
import {noop} from "form";
import Walkthrough from "components/walkthrough";
import connectToStores from "alt/utils/connectToStores";
import CurrentUserStore from "stores/currentuser";
import URI from "URIjs";

@connectToStores
class WalkthroughPlay extends React.Component {
	static defaultProps = {
		walkthrough: {},
		currentUser: {},
	};

	static getStores(props) {
		return [CurrentUserStore];
	}

	static getPropsFromStores(props) {
		const state = CurrentUserStore.getState();
		return {
			currentUser: state.users[null],
		};
	}

	backend = null;

	state = {
		widget: null,
	};

	playWalkthrough = (evt) => {
		noop(evt);
		this.backend.startPlay(this.props.walkthrough.uuid);
		this.setState({
			widget: this.backend.widget,
		});
	};

	playClose = (evt) => {
		noop(evt);
		this.setState({
			widget: null,
		});
		this.backend.stop();
	}

	componentWillMount() {
		this.backend = new WalkhubBackend();
		this.backend.onclose = this.playClose;
	}

	componentWillUnmount() {
		this.backend.stop();
	}

	render() {
		this.backend.canEdit = this.props.walkthrough.uid !== "" && this.props.walkthrough.uid === this.props.currentUser.UUID;

		let httpReloadURL = "";
		if (this.props.walkthrough && this.props.walkthrough.steps && this.props.walkthrough.steps[0]) {
			const pageProtocol = window.location.protocol.slice(0, -1);
			const walkthroughProtocol = URI(this.props.walkthrough.steps[0].arg0).protocol();
			if (pageProtocol === "https" && walkthroughProtocol === "http") {
				httpReloadURL = URI(window.location.href).protocol("http").toString();
			}
		}

		return (
			<div>
				<Walkthrough
					onPlayClick={this.playWalkthrough}
					editable={this.props.currentUser.UUID === this.props.walkthrough.uid}
					httpReloadURL={httpReloadURL}
					{...this.props}
				/>
				{this.state.widget}
			</div>
		);
	}
}

export default WalkthroughPlay;
