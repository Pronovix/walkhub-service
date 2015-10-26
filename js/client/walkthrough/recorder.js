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
import EventAbsorber from "client/walkthrough/eventabsorber";
import Util from "client/walkthrough/util";
import LocatorGenerator from "client/walkthrough/locator_generator";

class Recorder {

	constructor() {
		this.client = null;
		this.controller = null;
		this.state = null;
		this.started = false;
		this.unsubscribeFunc = null;
	}

	static instanceObject = null;

	static instance() {
		if (!Recorder.instanceObject) {
			Recorder.instanceObject = new Recorder();
		}

		return Recorder.instanceObject;
	}

	setClient(client) {
		this.client = client;
		return this;
	}

	setController(controller) {
		this.controller = controller;
		return this;
	}

	setState(state) {
		this.state = state;
		return this;
	}

	start() {
		if (this.started) {
			return;
		}

		var that = this;

		var mouseWrapper = function (clickedElement, eventData) { that.mouseEventHandler(clickedElement, eventData); };
		var keyboardWrapper = function (type, key) { that.keyboardEventHandler(type, key); };

		EventAbsorber.instance().subscribeToMouseEvents(mouseWrapper);
		EventAbsorber.instance().subscribeToKeyboardEvents(keyboardWrapper);

		this.unsubscribeFunc = function () {
			EventAbsorber.instance().unsubscribeFromMouseEvents(mouseWrapper);
			EventAbsorber.instance().unsubscribeFromKeyboardEvents(keyboardWrapper);
		};

		this.started = true;
	}

	stop() {
		if (!this.started) {
			return;
		}

		this.started = false;

		if (this.unsubscribeFunc) {
			this.unsubscribeFunc();
		}
	}

	save() {
		this.client.updateState(this.state);
	}

	animateRecordedElement(clickedElement) {
		let $e = $(clickedElement);
		$e.addClass("walkthrough-eventabsorber-recorded");
		setTimeout(function() {
			$e.removeClass("walkthrough-eventabsorber-recorded");
		}, 250);
	}

	mouseEventHandler(clickedElement, eventData) {
		if (!clickedElement) {
			return;
		}

		if (!Util.isInputElement(clickedElement)) {
			var locator = LocatorGenerator.instance().generate(clickedElement);
			this.client.saveStep("click", locator, null);
			this.animateRecordedElement(clickedElement);
		}

		if (clickedElement.length === 0) {
			return;
		}

		var rawClickedElement = clickedElement.get(0);

		Util.clickOnElement(rawClickedElement, eventData);

		if (window.document.activeElement === rawClickedElement) {
			return;
		}

		if (rawClickedElement.isContentEditable) {
			var focusElement = rawClickedElement;
			while (focusElement && focusElement.contentEditable === "inherit") {
				focusElement = focusElement.parentNode;
				if (window.document.activeElement === focusElement) {
					return;
				}
			}
			focusElement.focus();
		} else {
			rawClickedElement.focus();
		}
	}

	keyboardEventHandler(element, value) {
		var locator = LocatorGenerator.instance().generate(element);

		if (!locator) {
			return;
		}

		var tagName = (element.prop("tagName") || "").toLowerCase();
		switch (tagName) {
			case "select":
				this.client.saveStep("select", locator, "value=" + value);
				this.animateRecordedElement(element);
				break;
			case "input":
			case "textarea":
				var ispw = element.attr("type") === "password";
				if (ispw) {
					this.client.enablePasswordParameter();
				}
				this.client.saveStep("type", locator, ispw ? "[password]" : value);
				this.animateRecordedElement(element);
				break;
			default:
				if (element.length && element.get(0).isContentEditable) {
					var valueDom = $(element.html());
					valueDom.find(".walkthrough-eventabsorber-hover").removeClass("walkthrough-eventabsorber-hover");
					var finalValue = $("<div />").append(valueDom).html();
					this.client.saveStep("type", locator, finalValue);
					this.animateRecordedElement(element);
				} else {
					this.client.log(["TODO add support for: " + tagName, locator, value]);
				}
		}
	}

}

export default Recorder;
