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
import UserStore from "stores/user";
import URI from "URIjs";
import {isHTTPSPage} from "util";

@connectToStores
class WalkthroughPlay extends React.Component {
	static defaultProps = {
		walkthrough: {},
		currentUser: {},
	};

	static getStores(props) {
		return [UserStore];
	}

	static getPropsFromStores(props) {
		const state = UserStore.getState();
		return {
			currentUser: state.users[state.currentUser] || {},
		};
	}

	backend = null;

	state = {
		widget: null,
		autoplayed: false,
	};

	static contextTypes = {
		location: React.PropTypes.shape,
		history: React.PropTypes.shape,
	};

	playWalkthrough = (evt) => {
		noop(evt);

		const reloadURL = this.getHTTPReloadURL();
		if (reloadURL) {
			window.location = reloadURL;
			return;
		}

		this.backend.startPlay(this.props.walkthrough.uuid);
		this.setState({
			widget: this.backend.widget,
		});
	};

	playClose = (evt) => {
		noop(evt);

		if (this.shouldGoBack()) {
			// TODO figure out why the last entry gets duplicated in the history
			window.history.go(-2);
		}

		this.setState({
			widget: null,
		});
		this.backend.stop();
	}

	componentWillMount() {
		this.backend = new WalkhubBackend();
		this.backend.onclose = this.playClose;
	}

	componentDidMount() {
		this.maybeAutoplay(this.props);
	}

	componentWillUnmount() {
		this.backend.stop();
	}

	componentWillReceiveProps(nextProps) {
		this.maybeAutoplay(nextProps);
	}

	maybeAutoplay(props) {
		if (this.shouldAutoplay(props)) {
			this.setState({
				autoplayed: true,
			});
			setTimeout(() => {
				this.playWalkthrough();
			}, 100);
		}
	}

	shouldAutoplay(props) {
		const autoplay = this.context.location.query.autoplay;
		return !this.state.autoplayed && autoplay && props.walkthrough && autoplay === props.walkthrough.uuid;
	}

	shouldGoBack() {
		return !!this.context.location.query.goback;
	}

	getHTTPReloadURL() {
		if (this.props.walkthrough && this.props.walkthrough.steps && this.props.walkthrough.steps[0]) {
			const walkthroughProtocol = URI(this.props.walkthrough.steps[0].arg0).protocol();
			if (isHTTPSPage() && walkthroughProtocol === "http") {
				let httpOrigin = URI(WALKHUB_HTTP_URL);
				return URI(window.location.href)
					.protocol("http")
					.host(httpOrigin.host())
					.path(`/walkthrough/${this.props.walkthrough.uuid}`)
					.addSearch("autoplay", this.props.walkthrough.uuid)
					.addSearch("goback", true)
					.toString();
			}
		}

		return "";
	}

	render() {
		this.backend.canEdit = this.props.walkthrough.uid !== "" && this.props.walkthrough.uid === this.props.currentUser.UUID;

		const httpReloadURL = this.getHTTPReloadURL();

		return (
			<div className="list-wt">
				<Walkthrough
					onPlayClick={this.playWalkthrough}
					editable={this.props.currentUser.UUID === this.props.walkthrough.uid}
					httpReload={!!httpReloadURL}
					{...this.props}
				/>
				{this.state.widget}
			</div>
		);
	}
}

export default WalkthroughPlay;
