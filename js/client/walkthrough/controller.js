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

import Recorder from "client/walkthrough/recorder";
import CommandDispatcher from "client/walkthrough/command_dispatcher";
import EventAbsorber from "client/walkthrough/eventabsorber";
import Bubble from "client/walkthrough/bubble";
import Util from "client/walkthrough/util";
import editDialog from "client/walkthrough/editdialog";
import Translator from "client/walkthrough/translator";
import SocialSharing from "client/walkthrough/social_sharing";
import Walkhub from "client/walkhub";
import html2canvas from "html2canvas";

class Controller {

	constructor(client, executor, logger) {
		var that = this;

		this.client = client;
		this.executor = executor;
		this.logger = logger;
		this.state = {
			walkthrough: null,
			completed: false,
			stepIndex: 0,
			parameters: {},
			HTTPProxyURL: "",
			recording: false,
			next: [],
			screening: false,
			screensize: null,
		};

		this.playerMouseEventHandlerAdded = false;

		this.walkthrough = null;
		this.step = null;

		this.client.setStateChanged(function (_state) {
			that.state = _state;
			that.client.log(["New state", that.state]);
			if (that.state.recording) {
				if (that.state.recordStarted) {
					Recorder.instance()
						.setClient(that.client)
						.setController(that)
						.setState(that.state)
						.start();
				} else {
					that.state.recordStarted = true;
					that.client.updateState(that.state);
					CommandDispatcher.instance().executeCommand("open", {
						arg0: that.state.recordStartUrl
					});
				}
			} else {
				if (that.state.disableClicks && !that.playerMouseEventHandlerAdded) {
					EventAbsorber.instance()
						.disableHover()
						.subscribeToMouseEvents(function (clickedElement, eventData) {
							that.playerMouseEventHandler(clickedElement, eventData);
						});

					that.playerMouseEventHandlerAdded = true;
				}
				if (that.state.walkthrough) {
					that.refreshWalkthrough(function () {
						if (that.walkthrough.steps[that.state.stepIndex] && !that.state.completed) {
							that.client.log("Loading step");
							that.refreshStep();
						} else {
							that.client.log("Empty step");
							that.nextStep();
						}
					});
				}
			}
		});

		this.client.start();
	}

	playerMouseEventHandler(clickedElement, eventData) {
		if (Bubble.current && Bubble.current.editdialog) {
			return;
		}

		if (!clickedElement) {
			return;
		}

		if (clickedElement.length === 0) {
			return;
		}

		var rawClickedElement = clickedElement.get(0);

		if (this.clickShouldBeForwarded(clickedElement)) {
			Util.clickOnElement(rawClickedElement, eventData);

			if (Util.isInputElement(clickedElement)) {
				clickedElement.focus();
			}
		} else {
			if (window.confirm("This action is not part of the Walkthrough, to explore this page you can open it in a new tab.")) {
				window.open(window.location.href, "_blank");
			}
		}
	}

	clickShouldBeForwarded(clickedElement) {
		if (Util.isInputElement(clickedElement)) {
			return true;
		}

		if (this.step && this.step.pureCommand && !editDialog.actionNotLocatorBased[this.step.pureCommand]) {
			var locator = this.step.arg0;
			var element = Translator.instance().translate(locator);
			if (clickedElement.is(element)) {
				return true;
			}
		}

		return false;
	}

	getHTTPProxyURL() {
		return this.state.HTTPProxyURL;
	}

	getEditLink() {
		return this.state.editLink;
	}

	initStep() {
		var that = this;
		this.client.log("Step initialization started.");
		this.state.completed = false;
		this.client.updateState(this.state);
		this.executor.execute(this.step, false, function () {
			that.state.completed = true;
			that.client.updateState(that.state);
			that.client.log("Step completed");
		});
		if (CommandDispatcher.instance().isAutomaticCommand(this.step.pureCommand)) {
			this.client.log("Automatically executing step.");
			this.nextStep(true);
		}
	}

	finish() {
		this.logger.logResult(this.state, true);

		this.walkthrough = null;
		this.step = null;
		this.client.updateState(this.state);
		this.client.finish();
	}

	next() {
		var that = this;
		this.state.walkthrough = this.state.next.shift();
		this.state.completed = false;
		this.state.stepIndex = 0;
		this.walkthrough = null;
		this.step = null;
		this.client.updateState(this.state);
		this.refreshWalkthrough(function () {
			that.nextStep();
		});
	}

	nextStep(skip_screenshot = false) {
		var that = this;

		const after = () => {
			Bubble.current && Bubble.current.hide();
			if (!this.state.completed && this.step) {
				this.client.log("Executing incomplete step.");
				this.state.completed = true;
				this.client.updateState(this.state);
				this.executor.execute(this.step, true);
			}

			if (this.walkthrough.steps.length === this.state.stepIndex+1) { // Last step
				this.client.log("Last step");

				setTimeout(function () {
					var url = that.walkthrough.url;

					var share = "";
					for (var sl in SocialSharing) {
						if (SocialSharing.hasOwnProperty(sl)) {
							share += " " + SocialSharing[sl](url, that.name) + " ";
						}
					}

					var finish_text = "<p>This is the end of this walkthrough. Liked it?</p>";
					if (that.state.socialSharing === "1") {
						finish_text += "<p>Share it through one of the following services:</p>";
						finish_text += share;
					}

					var buttons = {};
					buttons.Finish = function () {
						that.finish();
					};
					if (that.state.next && that.state.next.length > 0) {
						buttons.Next = function () {
							that.next();
						};
					}

					that.executor.showExitDialog(finish_text, buttons);
				}, 100);
				return;
			}

			this.client.log("Loading next step (" + this.state.stepIndex + ")");
			this.state.stepIndex++;
			this.state.completed = false;
			this.client.updateState(this.state);
			this.refreshStep();
		};

		if (skip_screenshot) {
			after();
		} else {
			this.maybeScreenshot(after);
		}
	}

	updateCurrentStep(step, callback) {
		var that = this;
		console.log(["Updating step", step]);
		this.client.updateStep(this.state.walkthrough, this.state.stepIndex, step, function (data) {
			console.log(["Updated data", data]);
			that.step = data;
			callback(data);
		}, function () {
			that.client.showError("updateCurrentStep", "Updating the step failed.");
		});
	}

	refreshWalkthrough(callback) {
		var that = this;
		this.walkthrough = null;
		this.client.updateState(this.state);
		this.step = null;
		this.client.getWalkthrough(this.state.walkthrough, function (data) {
			that.walkthrough = data;
			that.walkthrough.url = WALKHUB_URL + "walkthrough/" + that.walkthrough.uuid;
			that.client.log(["Walkthrough loaded", that.walkthrough]);
			if (callback) {
				callback(data);
			}
		}, Walkhub.logParams);
	}

	refreshStep() {
		this.step = this.processStep(this.walkthrough.steps[this.state.stepIndex]);
		this.client.log(["Step loaded", this.step]);
		this.initStep();
	}

	processStep(step) {
		const props = ["arg0", "arg1", "highlight", "description"];

		for (var parameter in this.state.parameters) {
			if (this.state.parameters.hasOwnProperty(parameter)) {
				for (var prop in props) {
					if (props.hasOwnProperty(prop)) {
						prop = props[prop];
						if (step[prop]) {
							step[prop] = step[prop].replace("[" + parameter + "]", this.state.parameters[parameter]);
						}
					}
				}
			}
		}

		step.canEdit = this.state.allowEditing;

		step.andWait = /AndWait$/.test(step.cmd);
		step.pureCommand = step.andWait ? step.cmd.substr(0, step.cmd.length-7) : step.cmd;

		return step;
	}

	resizeCanvas(canvas) {
		const tmpcanvas = document.createElement("canvas");
		tmpcanvas.width = this.state.screensize.width;
		tmpcanvas.height = this.state.screensize.height;

		let sx = 0, sy = 0, swidth = tmpcanvas.width, sheight = tmpcanvas.height;

		if (canvas.width > tmpcanvas.width) {
			sx = Math.min(window.scrollX, canvas.width - tmpcanvas.width);
		} else if (canvas.width < tmpcanvas.width) {
			swidth = canvas.width;
		}
		if (canvas.height > tmpcanvas.height) {
			sy = Math.min(window.scrollY, canvas.height - tmpcanvas.height);
		} else if (canvas.height < tmpcanvas.height) {
			sheight = canvas.height;
		}

		tmpcanvas.getContext("2d").drawImage(canvas, sx, sy, swidth, sheight, 0, 0, tmpcanvas.width, tmpcanvas.height);

		return tmpcanvas;
	}

	cropImage(dataUrl, crop, after) {
		if (!crop) {
			if (after) {
				after(dataUrl);
			}
			return;
		}

		const img = new Image;
		img.onload = () => {
			const canvas = document.createElement("canvas");
			canvas.width = crop.width;
			canvas.height = crop.height;
			const ctx = canvas.getContext("2d");
			ctx.drawImage(img, crop.left * crop.ratio, crop.top * crop.ratio, crop.width * crop.ratio, crop.height * crop.ratio, 0, 0, canvas.width, canvas.height);
			if (after) {
				after(canvas.toDataURL("image/png"));
			}
		};
		img.src = dataUrl;
	}

	maybeScreenshot(after) {
		if (this.state.screening) {
			if (this.chromeExtensionScreenshot(after)) {
				return;
			}
			if (this.html2canvasScreenshot(after)) {
				return;
			}
		} else {
			if (after) {
				after();
			}
		}
	}

	chromeExtensionScreenshot(after) {
		if (window.WALKHUB_EXTENSION) {
			const key = Math.random().toString();

			const handler = (event) => {
				const data = typeof event.data === "string" ? JSON.parse(event.data) : event.data;
				if (data && data.screenshot_key === key && data.command === "saveScreenshot") {
					this.cropImage(data.img, this.state.screenshotCrop, (image) => {
						this.client.sendScreenshot(image);
						if (after) {
							after();
						}
					});
					window.removeEventListener("message", handler);
				}
			};

			window.addEventListener("message", handler);

			window.postMessage(JSON.stringify({
				command: "makeScreenshot",
				walkhub_extension_key: EXTENSIONID,
				screenshot_key: key,
				origin: window.location.origin,
			}), "*");
			return true;
		}
		return false;
	}

	html2canvasScreenshot(after) {
		html2canvas(document.body, {
			onrendered: (canvas) => {
				if (!this.state.screensize) {
					this.state.screensize = {
						width: window.innerWidth,
						height: window.innerHeight,
					};
					this.client.updateState(this.state);
				}

				if (canvas.height != this.state.screensize.height || canvas.width != this.state.screensize.width) {
					canvas = this.resizeCanvas(canvas);
				}

				const data = canvas.toDataURL("image/png");
				this.client.sendScreenshot(data);

				if (after) {
					after();
				}
			},
			background: undefined,
			letterRendering: true,
		});

		return true;
	}

}

export default Controller;
