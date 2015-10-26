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
import Util from "client/walkthrough/util";
import Context from "client/walkthrough/context";

class EventAbsorber {

	constructor() {
		this.mouseEventCallbacks = [];
		this.mouseEventAbsorber = null;

		this.keyboardEventCallbacks = [];
		this.keyboardWatcherLooping = false;
		this.activeElement = null;
		this.activeElementValue = null;
		this.previousHover = null;
		this.hover = true;

		window.addEventListener("beforeunload", function () {
			$(window.document.activeElement).blur();
		});
	}

	static instanceObject = null;

	static instance() {
		if (!EventAbsorber.instanceObject) {
			EventAbsorber.instanceObject = new EventAbsorber();
		}

		return EventAbsorber.instanceObject;
	}

	absorbKeyboardEvents() {
		var that = this;

		if (this.keyboardWatcherLooping) {
			return;
		}

		this.keyboardWatcherLooping = true;

		(function watcher() {
			if (that.activeElement !== window.document.activeElement) {
				var currentValue = null;
				var activeElement = $(that.activeElement);
				switch (Util.isInputElement(activeElement)) {
					case Util.inputElement.INPUT_ELEMENT:
						currentValue = activeElement.val();
						break;
					case Util.inputElement.CONTENTEDITABLE_ELEMENT:
						currentValue = $(activeElement).html();
						break;
				}

				if (that.activeElementValue !== currentValue && currentValue !== null) {
					for (var cb in that.keyboardEventCallbacks) {
						if (that.keyboardEventCallbacks.hasOwnProperty(cb)) {
							that.keyboardEventCallbacks[cb](activeElement, currentValue);
						}
					}
				}

				that.activeElement = window.document.activeElement;
				that.activeElementValue = currentValue;
			}
			if (that.keyboardWatcherLooping) {
				setTimeout(watcher, 100);
			}
		})();
	}

	subscribeToKeyboardEvents(callback) {
		this.keyboardEventCallbacks.push(callback);
		this.absorbKeyboardEvents();
	}

	unsubscribeFromKeyboardEvents(callback) {
		var i = this.keyboardEventCallbacks.indexOf(callback);
		if (i > -1) {
			this.keyboardEventCallbacks.splice(i, 1);
		}

		if (this.keyboardEventCallbacks.length === 0) {
			this.stopAbsorbingKeyboardEvents();
		}
	}

	stopAbsorbingKeyboardEvents() {
		this.keyboardWatcherLooping = false;
	}

	absorbMouseEvents() {
		if (this.mouseEventAbsorber) {
			return;
		}
		var that = this;
		var $w = $(window);

		this.mouseEventAbsorber = $("<div />")
			.css("background-color", "rgba(255, 255, 255, 0)")
			.css("z-index", Context.MAXIMUM_ZINDEX)
			.click(function (event) {
				var eventData = {
					canBubble: event.bubbles,
					cancelable: event.cancelable,
					detail: event.detail,
					screenX: event.screenX,
					screenY: event.screenY,
					clientX: event.clientX,
					clientY: event.clientY,
					ctrlKey: event.ctrlKey,
					altKey: event.altKey,
					shiftKey: event.shiftKey,
					metaKey: event.metaKey,
					button: event.button
				};

				event.preventDefault();
				event.stopPropagation();

				var clickedElement = that.getElementAtEvent(event);

				for (var cb in that.mouseEventCallbacks) {
					if (that.mouseEventCallbacks.hasOwnProperty(cb)) {
						that.mouseEventCallbacks[cb](clickedElement, eventData);
					}
				}

				return false;
			})
			.appendTo($("body"));

		this.resetOverlay();

		$w
			.bind("resize.walkhub", function (event) {
				that.resetOverlay();
			})
			.bind("mousemove.walkhub", function (event) {
				that.handleHovering(event);
				that.refreshHover(event);
			});
	}

	resetOverlay() {
		var $w = $(window);

		this.mouseEventAbsorber
			.css("width", $w.width() + "px")
			.css("height", $w.height() + "px")
			.css("position", "fixed")
			.css("top", "0")
			.css("left", "0");
	}

	subscribeToMouseEvents(callback) {
		this.mouseEventCallbacks.push(callback);
		this.absorbMouseEvents();
	}

	unsubscribeFromMouseEvents(callback) {
		var i = this.mouseEventCallbacks.indexOf(callback);
		if (i > -1) {
			this.mouseEventCallbacks.splice(i, 1);
		}

		if (this.mouseEventCallbacks.length === 0) {
			this.stopAbsorbingMouseEvents();
		}
	}

	stopAbsorbingMouseEvents() {
		$(window).unbind("mousemove.walkhub");
		this.removeHover();
		this.mouseEventAbsorber.remove();
		this.mouseEventAbsorber = null;
	}

	removeHover() {
		$(".walkthrough-eventabsorber-hover")
			.removeClass("walkthrough-eventabsorber-hover");
	}

	refreshHover(event) {
		this.removeHover();
		if (this.hover) {
			this.getElementAtEvent(event).addClass("walkthrough-eventabsorber-hover");
		}
	}

	disableHover() {
		this.hover = false;
		return this;
	}

	enableHover() {
		this.hover = true;
		return this;
	}

	handleHovering(event) {
		var currentElement = this.getElementAtEvent(event);
		if (currentElement.length) {
			currentElement = currentElement.get(0);
		} else {
			return;
		}

		var eventData = {
			canBubble: event.canBubble,
			cancelable: event.cancelable,
			detail: event.detail,
			screenX: event.screenX,
			screenY: event.screenY,
			clientX: event.clientX,
			clientY: event.clientY,
			ctrlKey: event.ctrlKey,
			altKey: event.altKey,
			shiftKey: event.shiftKey,
			metaKey: event.metaKey,
			button: event.button
		};

		if (currentElement !== this.previousHover) {
			Util.dispatchMouseEvent("mouseleave", this.previousHover, eventData + {relatedTarget: currentElement});
			Util.dispatchMouseEvent("mouseout", this.previousHover, eventData + {relatedTarget: currentElement});

			if (!this.previousHover || currentElement !== $(this.previousHover).parent()) {
				Util.dispatchMouseEvent("mouseenter", currentElement, eventData + {relatedTarget: this.previousHover});
			}
			Util.dispatchMouseEvent("mouseover", currentElement, eventData + {relatedTarget: this.previousHover});
			this.previousHover = currentElement;
		}

		Util.dispatchMouseEvent("mousemove", currentElement, eventData);
	}

	getElementAtEvent(event) {
		var pos = this.getPositionFromEvent(event, true);

		this.mouseEventAbsorber
			.css("top", pos.y + "px")
			.css("left", pos.x + "px")
			.css("width", "1px")
			.css("height", "1px")
			.css("position", "absolute");

		var element =  $(window.document.elementFromPoint(pos.x, pos.y - 1));

		this.resetOverlay();

		return element;
	}

	getPositionFromEvent(event, withscroll) {
		// @TODO IE support, see: http://stackoverflow.com/questions/3343384/mouse-position-cross-browser-compatibility-javascript
		return {
			x: event.pageX - (withscroll ? window.scrollX : 0),
			y: event.pageY - (withscroll ? window.scrollY : 0)
		};
	}

}

export default EventAbsorber;
