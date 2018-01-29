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
import Record from "components/record";
import RecordSaved from "components/recordsaved";
import {noop} from "form";
import WalkhubBackend from "walkthrough/walkhub_backend";
import flux from "control";
import {t} from "t";
import LoggedIn from "components/wrappers/loggedin";
import UserStore from "stores/user";
import WalkthroughStore from "stores/walkthrough";
import WalkthroughActions from "actions/walkthrough";
import connectToStores from "alt/utils/connectToStores";
import URI from "urijs";

@connectToStores
class RecordWrapper extends React.Component {

	static defaultProps = {
		siteinfos: {},
		currentUser: null,
	};

	static getStores(props) {
		return [WalkthroughStore, UserStore];
	}

	static getPropsFromStores(props) {
		const walkthroughStoreState = WalkthroughStore.getState();
		const userStoreState = UserStore.getState();

		return {
			siteinfos: walkthroughStoreState.siteinfos,
			currentUser: userStoreState.users[userStoreState.currentUser] || {},
		};
	}

	state = this.defaultState();

	backend = null;

	static contextTypes = {
		location: React.PropTypes.shape,
		history: React.PropTypes.shape,
	};

	isEmbedded() {
		return !!this.context.location.query.embedded;
	}

	isExtension() {
		return !!this.context.location.query.extension;
	}

	defaultState() {
		return {
			title: "",
			startingUrl: "",
			widget: null,
			steps: [],
			published: true,
			uuid: "",
		};
	}

	render() {
		const siteinfo = this.props.siteinfos[this.state.startingUrl];
		const page = this.isEmbedded() && this.state.uuid ?
			(
				<RecordSaved
					uuid={this.state.uuid}
					error={null}
					onBackClick={this.resetClick}
				/>
			) :
			(
				<Record
					embedded={this.isEmbedded()}
					title={this.state.title}
					startingUrl={this.state.startingUrl}
					steps={this.state.steps}

					onTitleChange={this.titleChange}
					onStartingUrlChange={this.startingUrlChange}
					onStartingUrlBlur={this.startingUrlBlur}

					onRecordClick={this.recordClick}
					onSaveClick={this.saveClick}
					onResetClick={this.resetClick}
					recordDisabled={!siteinfo}
					compatibilityWarning={siteinfo && !siteinfo.has_embed_code}
				/>
			);
		return (
			<LoggedIn color="info">
				<div className="wh-record-wrapper">
					{page}
					{this.state.widget}
				</div>
			</LoggedIn>
		);
	}

	titleChange = (evt) => {
		this.setState({title: evt.target.value});
	};

	startingUrlChange = (evt) => {
		this.setState({startingUrl: evt.target.value});
	};

	startingUrlBlur = (evt) => {
		let url = evt.target.value;
		if (url && !/^https?:/.test(url)) {
			url = "https://" + url;
		}

		this.setState({
			startingUrl: url,
		});

		if (url) {
			setTimeout(() => {
				WalkthroughStore.performSiteinfo(url);
			}, 0);
		}
	};

	recordClose = (evt) => {
		noop(evt);
		this.setState({
			widget: null,
		});
		this.backend.stop();
	};

	recordSave = (evt) => {
		this.recordClose(evt);
		this.saveClick(evt);
	};

	stepAdded = (cmd, arg0, arg1, title, description) => {
		let steps = this.state.steps;
		steps.push({
			cmd: cmd,
			arg0: arg0,
			arg1: arg1,
			highlight: arg0, // TODO
			title: title,
			description: description,
		});

		this.setState({steps: steps});
	}

	getRunner() {
		const wturl = URI(window.location.href);
		const siteurl = URI(this.state.startingUrl);
		if (this.isExtension() || wturl.protocol() !== siteurl.protocol()) {
			return WalkhubBackend.createRunnerFromName("popup");
		}
		const siteinfo = this.props.siteinfos[this.state.startingUrl];
		return WalkhubBackend.createRunnerFromSiteinfo(siteinfo);
	}

	recordClick = (evt) => {
		noop(evt);
		const title = this.state.title ?
			this.state.title :
			t("Walkthrough on {domain}", {
				"domain": URI(this.state.startingUrl).hostname(),
			});
		const runner = this.getRunner();
		if (runner.getName() === "popup") {
			window.alert(t("Your Walkthrough will be recorded in a new browser tab, just close the tab when you are finished."));
		}
		this.backend.startRecord(this.state.startingUrl, runner);
		this.setState({
			widget: this.backend.widget,
			title: title,
		});
	};

	saveClick = (evt) => {
		noop(evt);
		const walkthrough = {
			name: this.state.title,
			description: "", // TODO
			steps: this.state.steps,
			published: this.state.published,
		};

		WalkthroughStore.performPost(walkthrough);
	};

	resetClick = (evt) => {
		noop(evt);
		WalkhubBackend.embedResetState();
		this.reset();
	};

	onChange = (event) => {
		if (event.action === WalkthroughActions.CREATED_WALKTHROUGH) {
			const uuid = event.data.data.uuid;
			if (this.isExtension()) {
				WalkhubBackend.embedResetState();
				window.open(WALKHUB_URL+`walkthrough/${uuid}`);
				this.reset();
			} else if (this.isEmbedded()) {
				WalkhubBackend.embedSetSavedState();
				this.reset();
				this.setState({
					uuid: uuid,
				});
			} else {
				this.context.history.pushState(null, `/walkthrough/${uuid}`);
			}
		}
	};

	reset = (evt) => {
		noop(evt);
		this.initBackend();
		let state = this.defaultState();
		state.startingUrl = this.getStartingURL();
		this.setState(state);
	}

	initBackend() {
		this.backend = new WalkhubBackend();
		this.backend.onclose = this.isExtension() ? this.recordSave : this.recordClose;
		this.backend.onsave = this.recordSave;
		this.backend.addStepCallback = this.stepAdded;
	}

	getStartingURL() {
		return this.context.location.query.start || "";
	}

	dispatcherToken = null;

	componentWillMount() {
		this.setState({
			startingUrl: this.getStartingURL(),
		});
	}

	componentDidMount() {
		this.initBackend();
		this.dispatcherToken = flux.dispatcher.register(this.onChange);
		if (this.isExtension()) {
			window.addEventListener("message", this.messageHandler);
		}
		if (this.state.startingUrl) {
			setTimeout(() => {
				WalkthroughStore.performSiteinfo(this.state.startingUrl);
			}, 0);
		}
	}

	componentWillUnmount() {
		this.backend.stop();
		window.removeEventListener("message", this.messageHandler);
		if (this.dispatcherToken) {
			flux.dispatcher.unregister(this.dispatcherToken);
		}
	}

	messageHandler = (event) => {
		const data = JSON.parse(event.data);
		switch(data.type) {
			case "extensionStartRecord":
				this.setState({startingUrl: data.url}, () => {
					this.recordClick();
				});
				break;
			case "extensionGetCurrentUser":
				event.source.postMessage(JSON.stringify({
					type: "extensionCurrentUser",
					currentUser: this.props.currentUser,
				}), event.origin);
				break;
		}
	};

}

export default RecordWrapper;
