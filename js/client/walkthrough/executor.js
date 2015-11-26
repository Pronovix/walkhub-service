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

import Walkhub from "client/walkhub";
import Context from "client/walkthrough/context";
import SocialSharing from "client/walkthrough/social_sharing";
import Client from "client/walkthrough/client";
import ProxyServer from "client/walkthrough/proxy_server";
import Logger from "client/walkthrough/logger";
import Controller from "client/walkthrough/controller";
import Bubble from "client/walkthrough/bubble";
import CommandDispatcher from "client/walkthrough/command_dispatcher";
import Translator from "client/walkthrough/translator";
import {t} from "t";
import URI from "URIjs";

class Executor {

	constructor() {
		this.client = null;
		this.controller = null;
		this.proxy = null;
		this.origin = null;
	}

	start() {
		if (Walkhub.getInstance().initialized) {
			return;
		}
		Walkhub.getInstance().initialized = true;
		Context.start();
		this.origin = Executor.negotiateWalkhubOrigin();
		this.pingPong();
		SocialSharing.SocialSharingFix();
	}

	pingPong() {
		var that = this;

		var success = false;

		function pingPongServer(event) {
			if (that.client) {
				window.removeEventListener("message", pingPongServer);
				return;
			}

			var data = JSON.parse(event.data);
			if (data.type === "pong") {
				success = true;
				that.client = new Client(event.source, event.origin);
				that.proxy = new ProxyServer(event.source, event.origin);
				that.logger = new Logger(that.client);
				that.controller = new Controller(that.client, that, that.logger);

				that.logger.startWalkthrough();
				window.removeEventListener("message", pingPongServer);
			}
		}
		window.addEventListener("message", pingPongServer);

		if (window.parent && window.parent !== window) {
			Executor.ping(window.parent, window.location.origin);
			this.origin.forEach(function(origin) {
				if (window.location.origin !== origin) {
					Executor.ping(window.parent, origin);
				}
			});
		}

		setTimeout(function () {
			if (!success) {
				that.showExitDialog("<p>This website is associated with another WalkHub. Please make sure to use its own WalkHub to play this Walkthrough.</p>");
			}
		}, 1000);
	}

	showExitDialog(message, buttons) {
		var bubble = new Bubble(this.controller, null, {description: message, html: true});
		bubble.disableNextButton();

		if (buttons) {
			for (var b in buttons) {
				if (buttons.hasOwnProperty(b)) {
					bubble.addButton(b, buttons[b]);
				}
			}
		}

		bubble.show();
	}

	execute(step, force, onStepComplete) {
		var that = this;

		function noElement() {
			var bubble = new Bubble(that.controller, null, step);
			bubble.show();
		}

		setTimeout(function () {
			const command = step.pureCommand;
			if (CommandDispatcher.instance().resolve(command)) {
				CommandDispatcher.instance().initCommand(command, step, onStepComplete);

				if (force || CommandDispatcher.instance().isAutomaticCommand(command)) {
					CommandDispatcher.instance().executeCommand(command, step);
				} else if (step.highlight) {
					var error = false;
					Translator.instance().translateOrWait(step.highlight, {
						success: function (jqobj) {
							if (error) {
								that.client.suppressError("locator-fail");
							}
							var bubble = new Bubble(that.controller, jqobj, step);
							bubble.show();
						},
						waiting: function (tries, remainingtries) {
							const message = step.canEdit ?
								"The @number. bubble is not found. Go to the !editlink form to repair it. Technical info: @locator" :
								"The @number. bubble is not found. Report it to the owner.";
							if ((tries-remainingtries) > 10) {
								that.client.showError("locator-fail", t(message, {
									"@number": that.controller.state.stepIndex + 1,
									"@locator": step.highlight,
									"!editlink": `<a href="/walkthrough/${that.controller.state.walkthrough}" target="_top">edit walkthrough</a>`, // TODO replace this with a proper router generated link
								}));
							}
							error = true;
							that.logger.logResult(that.controller.state, false, "locator-fail: [locator]".replace("[locator]", step.highlight));
						},
						giveUp: noElement
					});
				} else {
					noElement();
				}
			} else {
				that.client.showError("command-not-supported",
					"The command '[command]' is not supported.".replace("[command]", command));
					that.logger.logResult(that.controller.state, false, "command-not-supported: [command]".replace("[command]", command));
			}
		}, 0);
	}

	getClient() {
		return this.client;
	}

	getProxy() {
		return this.proxy;
	}

	getController() {
		return this.controller;
	}

	static ping(source, origin) {
		var message = JSON.stringify({type: "ping", origin: window.location.origin});
		try {
			source.postMessage(message, origin);
		} catch (ex) {
			console.log(ex);
		}
	}

	static negotiateWalkhubOrigin() {
		let origins = [];
		origins.push(WALKHUB_URL);

		const url = URI(WALKHUB_URL);
		url.protocol(window.location.protocol.slice(0, -1));
		const protoURL = url.toString();
		if (protoURL != WALKHUB_URL) {
			origins.push(protoURL);
		}

		if (WALKHUB_HTTP_URL != WALKHUB_URL) {
			origins.push(WALKHUB_HTTP_URL);
		}

		return origins;
	}

}

export default Executor;
