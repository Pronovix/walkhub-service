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

import $ from "jquery";
import Context from "client/walkthrough/context";

class Client {
	constructor(frame, defaultOrigin) {
		var that = this;

		this.tickets = {};
		this.origin = defaultOrigin;
		this.baseURL = null;
		this.serverKey = null;
		this.proxyKey = null;
		this.frame = frame;
		this.stateChanged = null;
		this.id = Math.random().toString();

		this.handlers = {
			accept: function (data) {
				if (!that.serverKey && data.client_id === that.id) {
					if (!that.proxyKey) {
						that.origin = data.origin;
					}
					that.baseURL = data.baseurl;
					that.serverKey = data.key;
					Context.fullscreen = data.fullscreen;
					that.post({
						type: "getState",
					});
				}
			},
			success: function (data) {
				if (that.tickets[data.ticket]) {
					that.tickets[data.ticket].success(data.data);
					delete that.tickets[data.ticket];
				} else {
					that.log(`Invalid ticket: ${data.ticket}`);
				}
			},
			error: function (data) {
				if (that.tickets[data.ticket]) {
					that.tickets[data.ticket].error(data.status, data.error);
					delete that.tickets[data.ticket];
				} else {
					that.log(`Invalid ticket: ${data.ticket}`);
				}
			},
			updateState: function (data) {
				if (that.stateChanged) {
					that.stateChanged(data.state);
				}
			},
			setProxy: function (data) {
				that.proxyKey = data.proxy_key;
			},
		};

		this.handlers.accept.bypassConnect = true;

		window.addEventListener("message", function (event) {
			var data = JSON.parse(event.data);
			if (data.protocolVersion !== Context.protocolVersion) {
				console.log("protocol version mismatch");
				return;
			}
			var handler = data && data.type && that.handlers[data.type];
			if (handler) {
				if (handler.bypassConnect || (!data.client_id || that.id === data.client_id)) {
					handler(data, event.source);
				} else {
					console.log("client id mismatch", data);
				}
			} else {
				console.log("handler not found", data);
			}
		});
	}

	post(data) {
		data.key = data.key || this.serverKey;
		data.tag = data.tag || "client";
		data.protocolVersion = Context.protocolVersion;
		data.client_id = this.id;
		if (this.proxyKey) {
			data.proxy_key = this.proxyKey;
		}
		try {
			this.frame.postMessage(JSON.stringify(data), this.origin);
		} catch (e) {
			console.log(e, data, this.frame);
		}
	}

	postAsync(data, success, error) {
		data.ticket = data.ticket || window.Math.random().toString();
		this.tickets[data.ticket] = {
			success: success || function() {},
			error: error || function() {},
		};
		this.post(data);
	}

	setStateChanged(callback) {
		this.stateChanged = callback;
	}

	log(data) {
		this.post({
			type: "log",
			log: data
		});
	}

	showError(id, error) {
		this.post({
			type: "showError",
			id: id,
			error: error
		});
	}

	suppressError(id) {
		this.post({
			type: "suppressError",
			id: id
		});
	}

	updateState(state) {
		this.post({type: "setState", state: state});
	}

	saveStep(cmd, arg0, arg1, title, description) {
		this.post({
			type: "saveStep",
			cmd: cmd,
			arg0: arg0,
			arg1: arg1,
			title: title,
			description: description,
		});
	}

	enablePasswordParameter() {
		this.post({
			type: "enablePasswordParameter"
		});
	}

	logResult(result) {
		this.post({
			type: "logResult",
			result: result,
		});
	}

	getSuggestions(cmd, arg0, arg1, success) {
		this.postAsync({
			type: "getSuggestions",
			cmd: cmd,
			arg0: arg0,
			arg1: arg1,
		}, success);
	}

	getWalkthrough(uuid, success, error) {
		this.postAsync({
			type: "getWalkthrough",
			uuid: uuid,
		}, success, error);
	}

	updateStep(uuid, stepid, step, success, error) {
		this.postAsync({
			type: "updateStep",
			uuid: uuid,
			stepid: stepid,
			step: step,
		}, success, error);
	}

	sendScreenshot(data) {
		this.postAsync({
			type: "screenshot",
			data: data,
		});
	}

	finish() {
		this.post({type: "finished"});
	}

	start() {
		if (this.frame && this.origin) {
			this.post({
				type: "connect",
				origin: window.location.origin,
				url: window.location.href,
				walkhub: WALKHUB_URL,
				client_id: this.id,
			});
		}
	}
}

export default Client;
