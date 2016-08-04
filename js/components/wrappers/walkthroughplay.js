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
import WalkhubBackend from "walkthrough/walkhub_backend";
import {noop} from "form";
import Walkthrough from "components/walkthrough";
import connectToStores from "alt/utils/connectToStores";
import UserStore from "stores/user";
import WalkthroughStore from "stores/walkthrough";
import URI from "URIjs";
import {isHTTPSPage} from "util";
import flux from "control";
import WalkthroughActions from "actions/walkthrough";
import LogActions from "actions/log";

@connectToStores
class WalkthroughPlay extends React.Component {
	static defaultProps = {
		walkthrough: {},
		currentUser: {},
		siteinfos: {},
	};

	static getStores(props) {
		return [UserStore, WalkthroughStore];
	}

	static getPropsFromStores(props) {
		const state = UserStore.getState();
		const wtstate = WalkthroughStore.getState();
		return {
			currentUser: state.users[state.currentUser] || {},
			siteinfos: wtstate.siteinfos || {},
		};
	}

	backend = null;

	state = {
		widget: null,
		autoplayed: false,
		siteinfoLoaded: false,
		goingBack: false,
		logging: false,
		creatingScreening: false,
	};

	static contextTypes = {
		location: React.PropTypes.shape,
		history: React.PropTypes.shape,
	};

	startWalkthrough = (evt, screening) => {
		noop(evt);

		const reloadURL = this.getHTTPReloadURL(screening);
		if (reloadURL) {
			window.location = reloadURL;
			return;
		}

		const runner = this.createRunner();
		this.backend.startPlay(this.props.walkthrough.uuid, runner, screening);
		this.setState({
			widget: this.backend.widget,
		});
	};

	playWalkthrough = (evt) => {
		this.startWalkthrough(evt, false);
	};

	screenWalktrough = (evt) => {
		this.startWalkthrough(evt, true);
	};

	getChildContext() {
		return {
			playWalkthrough: this.playWalkthrough,
			screenWalkthrough: this.isEditable() ? this.screenWalktrough : null,
		};
	}

	static childContextTypes = {
		playWalkthrough: React.PropTypes.func,
		screenWalkthrough: React.PropTypes.func,
	};

	playClose = (evt) => {
		noop(evt);

		this.setState({
			goingBack: true,
			widget: null,
		});

		this.backend.stop();
	}

	componentWillMount() {
		this.backend = new WalkhubBackend();
		this.backend.onclose = this.playClose;
	}

	dispatcherToken = null;

	componentDidMount() {
		this.maybeAutoplay(this.props);
		this.maybeGetSiteinfo(this.props);
		this.dispatcherToken = flux.dispatcher.register(this.onChange);
	}

	componentWillUnmount() {
		this.backend.stop();
		if (this.dispatcherToken) {
			flux.dispatcher.unregister(this.dispatcherToken);
		}
	}

	componentWillReceiveProps(nextProps) {
		this.maybeAutoplay(nextProps);
		this.maybeGetSiteinfo(nextProps);
	}

	componentWillUpdate(nextProps, nextState) {
		this.maybeGoBack(nextProps, nextState);
	}

	onChange = (event) => {
		switch (event.action) {
			case WalkthroughActions.CREATING_SCREENING:
				this.setState({
					creatingScreening: true,
				});
				break;
			case WalkthroughActions.CREATED_SCREENING:
				this.setState({
					creatingScreening: false,
				});
				break;
			case LogActions.CREATING_LOG:
				this.setState({
					logging: true,
				});
				break;
			case LogActions.CREATED_LOG:
				this.setState({
					logging: false,
				});
				break;
		}
	};

	maybeAutoplay(props) {
		if (this.shouldAutoplay(props)) {
			this.setState({
				autoplayed: true,
			});
			setTimeout(() => {
				const screening = this.context.location.query.screening;
				if (screening) {
					this.screenWalktrough();
				} else {
					this.playWalkthrough();
				}
			}, 100);
		}
	}

	shouldAutoplay(props) {
		const autoplay = this.context.location.query.autoplay;
		return !this.state.autoplayed && autoplay && props.walkthrough && autoplay === props.walkthrough.uuid;
	}

	maybeGoBack(props, state) {
		const goback = this.context.location.query.goback;
		if (!goback) {
			return;
		}

		if (state.creatingScreening || state.logging) {
			return;
		}

		if (state.goingBack) {
			window.location = goback;
		}
	}

	getWalkthroughURL(props) {
		return (props.walkthrough && props.walkthrough.steps && props.walkthrough.steps[0]) ?
			props.walkthrough.steps[0].arg0 :
			null;
	}

	getHTTPReloadURL(screening) {
		const wturl = this.getWalkthroughURL(this.props);
		const siteinfo = this.getSiteinfo(this.props);
		if (wturl) {
			const walkthroughProtocol = URI(wturl).protocol();
			if (isHTTPSPage() && walkthroughProtocol === "http" && this.createRunner().reloadHTTP) {
				let httpOrigin = URI(WALKHUB_HTTP_URL);
				let gobackurl = URI(window.location.href);

				if (this.isEmbedded()) {
					gobackurl.addSearch("force_list", true);
				}

				let url = URI(window.location.href)
					.protocol("http")
					.host(httpOrigin.host())
					.path(`/walkthrough/${this.props.walkthrough.uuid}`)
					.addSearch("autoplay", this.props.walkthrough.uuid)
					.addSearch("goback", gobackurl.toString());

				if (screening) {
					url.addSearch("screening", "true");
				}

				if (siteinfo) {
					url.addSearch("force_runner", WalkhubBackend.runnerNameForSiteinfo(siteinfo));
				}

				return url.toString();
			}
		}

		return "";
	}

	isEmbedded() {
		return !!this.context.location.query.embedded;
	}

	forceList() {
		return !!this.context.location.query.force_list;
	}

	maybeGetSiteinfo(props) {
		if (this.state.siteinfoLoaded) {
			return;
		}

		const wturl = this.getWalkthroughURL(props);
		if (wturl && !props.siteinfos[wturl]) {
			this.setState({
				siteinfoLoaded: true,
			});
			setTimeout(() => {
				WalkthroughStore.performSiteinfo(wturl);
			}, 0);
		}
	}

	createRunner() {
		const force = this.context.location.query.force_runner;
		if (force) {
			return WalkhubBackend.createRunnerFromName(force);
		}

		return WalkhubBackend.createRunnerFromSiteinfo(this.getSiteinfo());
	}

	getSiteinfo() {
		const wturl = this.getWalkthroughURL(this.props);
		return this.props.siteinfos[wturl] || {};
	}

	iframeBlocked() {
		return this.getSiteinfo().blocks_iframe;
	}

	isEditable() {
		return this.props.walkthrough.uid !== "" && this.props.walkthrough.uid === this.props.currentUser.UUID;
	}

	render() {
		const editable = this.isEditable();
		this.backend.canEdit = editable;

		const httpReloadURL = this.getHTTPReloadURL(false);

		return (
			<div className="list-wt">
				<Walkthrough
					onPlayClick={this.playWalkthrough}
					onScreeningClick={this.screenWalktrough}
					editable={editable}
					httpReload={!!httpReloadURL}
					iframeBlocked={this.iframeBlocked()}
					{...this.props}
					>
					{this.props.children}
				</Walkthrough>
				{this.state.widget}
			</div>
		);
	}
}

export default WalkthroughPlay;
