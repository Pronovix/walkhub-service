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
import Bubble from "client/walkthrough/bubble";

class editDialog {

	constructor(step, bubbleContentWrapper) {
		this.step = step;
		this.submit = function () {};
		this.success = function () {};
		this.controller = null;
		this.form = null;
		this.bubbleContentWrapper = bubbleContentWrapper;
	}

	static actionHasNoArguments = {
		altKeyDown: true,
		altKeyUp: true,
		"break": true,
		chooseCancelOnNextConfirmation: true,
		chooseOkOnNextConfirmation: true,
		close: true,
		controlKeyDown: true,
		controlKeyUp: true,
		deleteAllVisibleCookies: true,
		deselectPopUp: true,
		goBack: true,
		metaKeyDown: true,
		metaKeyUp: true,
		refresh: true,
		shiftKeyDown: true,
		shiftKeyUp: true,
		windowFocus: true,
		windowMaximize: true
	}

	static actionNotLocatorBased = {
		addLocationStrategy: "strategy name",
		addScript: "script content",
		allowNativeXpath: "allow (boolean)",
		answerOnNextPrompt: "answer",
		captureEntirePageScreenshot: "filename",
		createCookie: "name-value pair",
		deleteCookie: "name",
		echo: "message",
		ignoreAttributesWithoutValue: "ignore (boolean)",
		open: "url",
		openWindow: "url",
		pause: "wait time",
		removeScript: "script tag id",
		rollup: "rollup name",
		runScript: "script",
		selectPopUp: "window id",
		selectWindow: "window id",
		setBrowserLogLevel: "log level",
		setMouseSpeed: "pixels",
		setSpeed: "value",
		setTimeout: "value",
		store: "expression",
		useXpathLibrary: "library name",
		waitForCondition: "script",
		waitForFrameToLoad: "frame address",
		waitForPageToLoad: "timeout",
		waitForPopUp: "window id"
	}

	static actionSecondArguments = {
		addLocationStrategy: "function definition",
		addScript: "script tag id",
		addSelection: "option locator",
		assignId: "identifier",
		captureEntirePageScreenshot: "kwargs",
		clickAt: "coordinates",
		contextMenuAt: "coordinates",
		createCookie: "options",
		deleteCookie: "options",
		doubleClickAt: "coordinates",
		dragAndDrop: "movements",
		fireEvent: "event name",
		keyDown: "key sequence",
		keyPress: "key sequence",
		keyUp: "key sequence",
		mouseDownAt: "coordinates",
		mouseDownRightAt: "coordinates",
		mouseMoveAt: "coordinates",
		mouseUpAt: "coordinates",
		mouseUpRightAt: "coordinates",
		openWindow: "window id",
		removeSelection: "option locator",
		rollup: "kwargs",
		select: "option locator",
		setCursorPosition: "position",
		store: "variable name",
		type: "value",
		typeKeys: "value",
		waitForCondition: "timeout",
		waitForFrameToLoad: "timeout",
		waitForPopUp: "timeout"
	}

	setSubmitCallback(submit) {
		this.submit = submit;
		return this;
	}

	setSuccessCallback(success) {
		this.success = success;
		return this;
	}

	setController(controller) {
		this.controller = controller;
		return this;
	}

	open() {
		var that = this;

		this.form = $("<form><fieldset></fieldset></form>");
		var fieldset = $("fieldset", this.form);

		$("<label />")
			.attr("for", "title")
			.html("Title")
			.appendTo(fieldset);

		var title = $("<input />")
			.attr("type", "textfield")
			.attr("name", "title")
			.attr("id", "title")
			.val(this.step.title)
			.appendTo(fieldset);

		$("<label />")
			.attr("for", "description")
			.html("Description")
			.appendTo(fieldset);

		var description = $("<textarea />")
			.val(this.step.description)
			.attr("name", "description")
			.attr("id", "description")
			.appendTo(fieldset);

		var suggestionwrapper = $("<div />")
			.attr("class", "suggestions")
			.appendTo(fieldset)
			.hide();

		$("<p class=\"wtbubble-editlink\" />")
			.html("<a href=\"[LINK]\" class=\"wtbubble-editlink\" target=\"_top\">To add, remove or reorder steps visit the Walkthrough edit form</a>".replace("[LINK]", this.controller.getEditLink()))
			.appendTo(fieldset);

		$("<hr />")
			.appendTo(fieldset);

		$("<input />")
			.attr("type", "submit")
			.val("Save")
			.appendTo(fieldset);

		var movebutton = $("<input />")
			.attr("type", "submit")
			.val("Move")
			.appendTo(fieldset)
			.click(function (event) {
				event.preventDefault();

				Bubble.current.beginMove();

				return false;
			});

		const arg0 = $("<input />")
			.attr("type", "hidden")
			.attr("name", "arg0")
			.attr("id", "arg0")
			.val(this.step.arg0)
			.appendTo(fieldset);

		const arg1 = $("<input />")
			.attr("type", "hidden")
			.attr("name", "arg1")
			.attr("id", "arg1")
			.val(this.step.arg1)
			.appendTo(fieldset);

		this.form.submit(function (event) {
			event.preventDefault();

			that.step.title = title.val();
			that.step.description = description.val();
			that.step.arg0 = arg0.val();
			that.step.highlight = that.step.arg0;
			that.step.arg1 = arg1.val();
			that.submit();
			that.form.remove();
			that.form = null;
			that.controller.updateCurrentStep(that.step, that.success);
		});

		this.controller.client.getSuggestions(this.step.cmd, this.step.arg0, this.step.arg1, function (data) {
			suggestionwrapper
				.show()
				.append($("<p/>").text("Suggestions: "));
			for (var i in data) {
				if (data.hasOwnProperty(i)) {
					$("<p />")
						.text(data[i])
						.click(function (event) {
							event.preventDefault();
							description.val($(this).text());
						})
						.css("cursor", "pointer")
						.css("font-size", "small")
						.appendTo(suggestionwrapper);
				}
			}
		});

		this.form.appendTo(this.bubbleContentWrapper);
	}

}

export default editDialog;
