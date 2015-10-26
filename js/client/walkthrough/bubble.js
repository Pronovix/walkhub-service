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
import {MAXIMUM_ZINDEX} from "util";
import editDialog from "client/walkthrough/editdialog";
import EventAbsorber from "client/walkthrough/eventabsorber";
import LocatorGenerator from "client/walkthrough/locator_generator";

class Bubble {

	static current = null;

	constructor(controller, element, step) {
		this.controller = controller;
		this.element = element;
		this.step = step;
		this.tipGuide = null;
		this.nub = null;
		this.contentWrapper = null;
		this.nextButton = null;
		this.editButton = null;
		this.title = null;
		this.description = null;
		this.editdialog = null;
		this.resizeEventHandler = null;
		this.stopAdjusting = false;

		this.nextButtonDisabled = false;

		this.extraButtons = {};
	}

	disableNextButton() {
		this.nextButtonDisabled = true;
		return this;
	}

	addButton(text, callback) {
		this.extraButtons[text] = callback;
		return this;
	}

	show() {
		var that = this;

		Bubble.current = this;

		if (Context.isUnloading()) {
			return;
		}

		this.resizeEventHandler = function () {
			that.reposition();
		};

		$(window).bind("resize", this.resizeEventHandler);

		this.tipGuide = $("<div />")
			.css("z-index", MAXIMUM_ZINDEX)
			.addClass("wtbubble-tip-guide");

		this.nub = $("<span />")
			.addClass("wtbubble-nub")
			.appendTo(this.tipGuide);

		this.contentWrapper = $("<div />")
			.attr("role", "dialog")
			.addClass("wtbubble-content-wrapper")
			.appendTo(this.tipGuide);

		this.title = $("<h5 />")
			.addClass("wtbubble-step-title")
			.appendTo(this.contentWrapper);

		if (this.step.html) {
			this.title.html(this.step.title);
		} else {
			this.title.text(this.step.title);
		}

		if (this.step.title) {
			this.title.show();
		} else {
			this.title.hide();
		}

		this.description = $("<p />")
			.addClass("wtbubble-step-description")
			.appendTo(this.contentWrapper);

		if (this.step.html) {
			this.description.html(this.step.description);
		} else {
			this.description.text(this.step.description);
		}

		this.nextButton = $("<a />")
			.attr("href", "#")
			.text("Next")
			.addClass("wtbubble-button")
			.addClass("wtbubble-next")
			.addClass("wtbubble-button")
			.click(function (event) {
				event.preventDefault();
				that.hide();
				that.controller.nextStep();
			})
			.appendTo(this.contentWrapper);

		if (this.nextButtonDisabled) {
			this.nextButton.hide();
		}

		if (this.step.canEdit) {
			this.editButton = $("<a />")
				.attr("href", "#")
				.addClass("wtbubble-edit")
				.addClass("wtbubble-button")
				.text("Edit")
				.click(function (event) {
					event.preventDefault();
					that.editdialog = new editDialog(that.step, that.contentWrapper);
					that.editdialog
						.setController(that.controller)
						.setSubmitCallback(function () {
							that.nextButton.show();
							that.editButton.show();
						})
						.setSuccessCallback(function (step) {
							that.title.text(step.title);
							that.title[step.title ? "show" : "hide"]();
							that.description.text(step.description);
							that.editdialog = null;
						})
						.open();
					that.nextButton.hide();
					that.editButton.hide();
				})
				.appendTo(this.contentWrapper);
		}

		for (var btn in this.extraButtons) {
			if (this.extraButtons.hasOwnProperty(btn)) {
				(function () {
					var key = btn;
					$("<a />")
						.attr("href", "#")
						.addClass("wtbubble-extrabutton")
						.addClass("wtbubble-button")
						.addClass("wtbubble-" + btn.toLowerCase().replace(/\s/g, "-"))
						.html(btn)
						.click(function (event) {
							event.preventDefault();
							that.extraButtons[key]();
						})
						.appendTo(that.contentWrapper);
				})();
			}
		}

		$("body").append(this.tipGuide);

		this.resetBubble();
		this.reposition();
		function reAdjust() {
			if (!that.stopAdjusting) {
				that.reposition(true);
				setTimeout(reAdjust, 1000);
			}
		}

		setTimeout(reAdjust, 500);
	}

	hide() {
		this.stopAdjusting = true;

		if (this.tipGuide) {
			this.tipGuide.remove();
		}

		if (this.resizeEventHandler) {
			$(window).unbind("resize", this.resizeEventHandler);
		}

		this.tipGuide = null;
		this.contentWrapper = null;
		this.nub = null;
		this.nextButton = null;
		this.editButton = null;
		this.title = null;
		this.description = null;
	}

	reposition(noScroll) {
		if (this.tipGuide && this.tipGuide.css("display") === "none") {
			return;
		}
		if (this.element) {
			this.moveBubble(this.element);
			if (!noScroll) {
				this.scrollToElement(this.element);
			}
		} else {
			this.moveBubble(null);
		}
	}

	beginMove() {
		this.tipGuide.css("display", "none");

		this.hideModalBackground();

		var that = this;

		EventAbsorber.instance().enableHover();

		EventAbsorber.instance().subscribeToMouseEvents(function editorElementClick (clickedElement) {
			var newLocator = LocatorGenerator.instance().generate(clickedElement);
			if (newLocator) {
				that.moveBubble(clickedElement);
				that.element = clickedElement;
				$("#firstarg", that.editdialog.form).val(newLocator);
			} else {
				that.resetBubble();
			}

			EventAbsorber.instance().disableHover();

			EventAbsorber.instance().unsubscribeFromMouseEvents(editorElementClick);
		});
	}

	resetNub() {
		this.nub
			.removeClass("top")
			.removeClass("bottom")
			.removeClass("left")
			.removeClass("right")
			// In the mobile view, the left css property will be explicitly set.
			.attr("style", "");
	}

	moveBubble(element) {
		this.resetBubble();
		this.hideModalBackground();

		var orientations = this.isPhone() ?
			["bottom"] :
			["bottom", "top", "right", "left", "bottom"];

		var nubOrientations = {
			"bottom": "top",
			"top": "bottom",
			"left": "right",
			"right": "left",
		};

		this.resetNub();

		if (!element) {
			this.modalPosition();
			return;
		}

		for (var o in orientations) {
			if (orientations.hasOwnProperty(o)) {
				this.resetNub();
				this.nub.addClass(nubOrientations[orientations[o]]);

				var pos = this.getBubblePosition(element, orientations[o]);
				if (this.isPhone()) {
					this.tipGuide
						.css("left", 0)
						.css("top", pos.y + "px");
					this.nub
						.css("left", pos.x + "px");
				} else {
					this.tipGuide
						.css("left", pos.x + "px")
						.css("top", pos.y + "px");
				}

				if (this.checkCorners()) {
					return;
				} else {
					console.log("Corner check failed, trying with a different orientation");
				}
			}
		}
	}

	resetBubble() {
		if (this.tipGuide) {
			this.tipGuide.show();
		}
	}

	getBubblePosition(element, orientation) {
		var pos = {x: 0, y: 0};
		var tipHeight = this.tipGuide.outerHeight();
		var tipWidth = this.tipGuide.outerWidth();
		var nubHeight = this.nub.outerHeight();
		var nubWidth = this.nub.outerWidth();
		var nubLeft = this.nub.position().left;
		var offset = element.offset();
		var elementHeight = element.outerHeight();
		var elementWidth = element.outerWidth();

		// @TODO check if modal

		switch (orientation) {
			case "top":
				pos.y = offset.top - tipHeight - nubHeight;
				pos.x = offset.left - nubLeft;
				break;
			case "bottom":
				pos.y = offset.top + elementHeight + nubHeight;
				pos.x = offset.left - nubLeft;
				break;
			case "left":
				pos.y = offset.top - (tipHeight/2 - elementHeight/2);
				pos.x = offset.left - tipWidth - nubWidth;
				break;
			case "right":
				pos.y = offset.top - (tipHeight/2 - elementHeight/2);
				pos.x = elementWidth + offset.left + nubWidth;
				break;
		}

		return pos;
	}

	modalPosition() {
		var w = $(window);
		var centerX = (w.width() - this.tipGuide.outerWidth()) / 2 + window.scrollX;
		var centerY = (w.height() - this.tipGuide.outerHeight()) / 2 + window.scrollY;
		this.tipGuide
			.css("top", centerY)
			.css("left", centerX);

		this.showModalBackground();
	}

	showModalBackground() {
		this.hideModalBackground();
		$("<div />")
			.addClass("wtbubble-modal-bg")
			.appendTo($("body"));
	}

	hideModalBackground() {
		$("div.wtbubble-modal-bg").remove();
	}

	checkCorners() {
		var offset = this.tipGuide.offset();
		var tipWidth = this.tipGuide.outerWidth();
		var tipHeight = this.tipGuide.outerHeight();
		var d = $(document);
		var originalWidth = d.width();
		var originalHeight = d.height();
		var retval = true;

		if (offset.top < 0) {
			return false;
		}

		if (offset.left < 0) {
			return false;
		}

		this.tipGuide.hide();

		if (!offset) {
			return true;
		}

		// check for bottom overflow
		if (offset.top + tipHeight > d.height()) {
			retval = false;
		}

		// check for right overflow
		if (offset.left + tipWidth > d.width()) {
			retval = false;
		}

		// check for document size changes
		if (originalHeight !== d.height() || originalWidth !== d.width()) {
			retval = false;
		}

		this.tipGuide.show();

		return retval;
	}

	isPhone() {
		if (window.Modernizr && window.Modernizr.mq) {
			return window.Modernizr.mq("only screen and (max-width: " + Context.mobileBreakpoint + "px)");
		}

		return $(window).width() < Context.mobileBreakpoint;
	}

	scrollToElement(element) {
		var windowHalf = $(window).height() / 2;
		var tipOffset = Math.ceil(element.offset().top - windowHalf + this.tipGuide.outerHeight());

		$("html, body").stop().animate({
			scrollTop: tipOffset,
		});
	}

}

export default Bubble;
