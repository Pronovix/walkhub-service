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

import axios from "axios";
import {baseUrl, capitalizeFirstLetter} from "util";
import React from "react";
import WalkhubIframe from "components/walkhub_iframe";
import {noop} from "form";
import {t} from "t";
import WalkhubBackendActions from "actions/walkhub_backend";
import WalkthroughStore from "stores/walkthrough";

const getdata = window.location.search.substr(1).split("&").reduce(function (obj, str) {
	var arrstr = str.split("=");
	obj[arrstr.shift()] = arrstr.join("=");
	return obj;
}, {});

class WalkhubBackend {

	static allowEditing = true;

	defaultState() {
		return {
			walkthrough: null,
			completed: false,
			stepIndex: 0,
			parameters: {},
			HTTPProxyURL: "",
			editLink: "",
			next: [],
			recording: false,
			recordedSteps: [],
			recordBuffer: {},
			recordStartUrl: "",
			recordStarted: false,
			allowEditing: WalkhubBackend.allowEditing && this.canEdit,
		};
	}

	static keyBypass = {
		connect: true,
		ping: true,
	};

	constructor() {
		this.key = Math.random().toString();
		this.currentUrl = null;
		this.origin = null;
		this.method = null;
		this.widget = null;
		this.recording = false;
		this.addStepCallback = null;
		this.onclose = null;
		this.onsave = null;
		this.canEdit = false;
		this.state = this.defaultState();
	}

	startRecord(start = "") {
		this.state = this.defaultState();
		this.recording = true;
		this.state.recording = true;
		this.state.recordStartUrl = start;
		this.addStep("open", start, null);
		this.startServer();
	}

	startPlay(uuid) {
		this.state = this.defaultState();
		this.recording = false;
		this.state.walkthrough = uuid;
		this.state.editLink = WALKHUB_URL + `walkthrough/${uuid}`;
		this.startServer();
	}

	startServer() {
		const onclose = (evt) => {
			noop(evt);
			if (this.onclose) {
				this.onclose();
			}

			WalkhubBackendActions.close();
			WalkhubBackend.embeddedPost({type: "end"});
		};

		const onsave = (evt) => {
			noop(evt);
			if (this.onsave) {
				this.onsave();
			}

			WalkhubBackendActions.close();
			WalkhubBackend.embeddedPost({type: "end"});
			WalkhubBackend.embeddedPost({type: "embedState", state: "saved"});
		};

		WalkhubBackend.embeddedPost({type: "start"});
		window.addEventListener("message", this.onMessageEventHandler);
		this.widget = (
			<WalkhubIframe
				src="/assets/start.html"
				recdot={this.recording}
				onClose={onclose}
				actionButton={this.recording ? t("Finish & Save") : null}
				actionButtonClassName="btn-success"
				onActionButtonClick={onsave}
			/>
		);
		console.log("Starting walkhub backend...");
	}

	stop() {
		window.removeEventListener("message", this.onMessageEventHandler);
		console.log("Stopping walkhub backend...");
	}

	maybeProxy(newdata, olddata) {
		if (olddata.proxy_key) {
			newdata.proxy_key = olddata.proxy_key;
		}

		return newdata;
	}

	logMessage(msg, prefix) {
		if (msg.type && msg.type === "log") {
			return;
		}

		console.log(prefix + "\t" + JSON.stringify(msg));
	}

	post(message, source, origin) {
		if (source.postMessage) {
			this.logMessage(message, ">> ");
			source.postMessage(JSON.stringify(message), origin || this.origin);
		} else {
			console.log("Sending message failed.");
		}
	}

	static embeddedPost(msg) {
		const origin = (getdata.embedorigin && window.parent) ? getdata.embedorigin : null;
		if (origin) {
			if (!msg.origin) {
				msg.origin = decodeURIComponent(origin);
			}
			if (!msg.ticket && getdata.ticket) {
				msg.ticket = getdata.ticket;
			}
			const jsonmsg = JSON.stringify(msg);
			console.log("EMBED SEND " + jsonmsg);
			window.parent.postMessage(jsonmsg, decodeURIComponent(origin));
		}
	}

	success(source, ticket, data) {
		this.post(this.maybeProxy({
			type: "success",
			data: data,
			ticket: ticket,
		}, data), source);
	}

	error(source, ticket, data) {
		this.post(this.maybeProxy({
			type: "error",
			data: data,
			ticket: ticket,
		}, data), source);
	}

	onMessageEventHandler = (event) => {
		const data = JSON.parse(event.data);
		const handler = data && data.type && !!this["handle" + capitalizeFirstLetter(data.type)];
		if (handler && (WalkhubBackend.keyBypass[data.type] || (data.key && data.key === this.key))) {
			this.logMessage(data, "<< ");
			this["handle" + capitalizeFirstLetter(data.type)](data, event.source);
			if (WalkhubBackendActions[data.type]) {
				WalkhubBackendActions[data.type](data, event.source);
			}
		} else {
			console.log("Message discarded", JSON.stringify(data), event);
		}
	}

	addStep(cmd, arg0, arg1) {
		if (this.addStepCallback) {
			this.addStepCallback(cmd, arg0, arg1);
		}
		WalkhubBackendActions.addStep(cmd, arg0, arg1);
		WalkhubBackend.embeddedPost({type: "embedState", state: "recorded"});
	}

	static embedSetSavedState() {
		WalkhubBackend.embeddedPost({type: "embedState", state: "saved"});
	}

	static embedResetState() {
		WalkhubBackend.embeddedPost({type: "embedState", state: ""});
	}

	static embedSetListState() {
		WalkhubBackend.embeddedPost({type: "embedState", state: "list"});
	}

	handlePing(data, source) {
		this.post({
			type: "pong",
			tag: "server",
		}, source, data.origin);
	}

	handleConnect(data, source) {
		this.origin = data.origin;
		this.currentUrl = data.url;
		this.post(this.maybeProxy({
			type: "connect_ok",
			origin: window.location.origin,
			baseurl: baseUrl(),
			key: this.key,
		}, data), source);
		WalkhubBackendActions.clearErrors();
	}

	handleGetState(data, source) {
		this.post(this.maybeProxy({
			type: "state",
			state: this.state,
		}, data), source);
	}

	handleSetState(data, source) {
		console.log("State updated", data.state);
		this.state = data.state;
	}

	handleSaveStep(data, source) {
		this.addStep(data.cmd, data.arg0, data.arg1);
	}

	handleEnablePasswordParameter(data, source) {
	}

	handleLog(data, source) {
		console.log("REMOTE LOG", data.log);
	}

	handleShowError(data, source) {
	}

	handleSuppressError(data, source) {
	}

	handleLogResult(data, source) {
		// TODO
	}

	handleGetSuggestions(data, source) {
		this.success(source, data.ticket, []); // TODO
	}

	handleGetWalkthrough(data, source) {
		// Since walkthroughs are started from a walkthrough page, the
		// walkthrough must be in the cache already.
		const walkthroughs = WalkthroughStore.getState().walkthroughs;
		if (walkthroughs[data.uuid]) {
			this.success(source, data.ticket, walkthroughs[data.uuid]);
		} else {
			this.error(source, data.ticket, "walkthrough-not-found");
		}
	}

	handleUpdateStep(data, source) {
		// data.uuid, data.stepid, data.step
		let walkthrough = WalkthroughStore.getState().walkthroughs[data.uuid];
		walkthrough.steps[data.stepid] = data.step;
		WalkthroughStore.performPut(walkthrough);
		this.success(source, data.ticket, data.step);
	}

	handleFinished(data, source) {
		WalkhubBackend.embeddedPost({type: "end"});
		this.state = this.defaultState();
		WalkhubBackendActions.close();
		if (this.onclose) {
			this.onclose();
		}
	}
}

export default WalkhubBackend;
