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
import Walkhub from "client/walkhub";

let Util = {

	log: function () {
		Walkhub.getInstance().currentExecutor.getClient().log(
			arguments.length === 1 ? arguments[0] : arguments
		);
	},

	tagName: function (element) {
		var tn = $(element).prop("tagName");
		if (tn === null || tn === undefined || !tn.toLowerCase) {
			Util.log(["Invalid element", element, tn]);
			return null;
		}

		return tn.toLowerCase();
	},

	filterXSS: function (text) {
		var dom = $.parseHTML(text);

		$("script", dom).remove();

		$("a[href^=\"javascript:\"]").attr("href", "#");

		dom.each(function () {
			var that = $(this);
			for (var attribute in this.attributes) {
				if (this.attributes.hasOwnProperty(attribute) && attribute.indexOf("on") === 0 && that.attr(attribute)) {
					that.attr(attribute, "");
				}
			}
		});

		return $("<div />").append(dom).html();
	},

	dispatchMouseEvent: function (type, element, eventData) {
		var ed = eventData || {
			canBubble: true,
			cancelable: true
		};
		var event = document.createEvent("MouseEvents");
		event.initMouseEvent(
			type,
			ed.canBubble,
			ed.cancelable,
			window,
			ed.detail,
			ed.screenX,
			ed.screenY,
			ed.clientX,
			ed.clientY,
			ed.ctrlKey,
			ed.altKey,
			ed.shiftKey,
			ed.metaKey,
			ed.button,
			null
		);
		if (element) {
			element.dispatchEvent(event);
		}
	},

	clickOnElement: function (element, eventData) {
		Util.dispatchMouseEvent("mousedown", element, eventData);
		Util.dispatchMouseEvent("mouseup", element, eventData);
		Util.dispatchMouseEvent("click", element, eventData);
	},

	isInputElement: function (element) {
		if (element.length === 0) {
			return Util.inputElement.NOT_INPUT_ELEMENT;
		}
		// check for standard input elements
		var tn = Util.tagName(element);
		if (tn === "textarea") {
			return Util.inputElement.INPUT_ELEMENT;
		}
		if (tn === "select") {
			return Util.inputElement.INPUT_ELEMENT;
		}
		if (tn === "option") {
			return Util.inputElement.INPUT_ELEMENT;
		}
		if (tn === "input") {
			switch (element.attr("type")) {
				case "button":
				case "submit":
					return Util.inputElement.NOT_INPUT_ELEMENT;
				default:
					return Util.inputElement.INPUT_ELEMENT;
			}
		}

		// check for contenteditable
		var rawElement = element.get(0);
		if (rawElement.contentEditable !== null && rawElement.contentEditable !== undefined) {
			if (rawElement.isContentEditable) {
				return Util.inputElement.CONTENTEDITABLE_ELEMENT;
			}
		} else {
			for (var e = element; e.length > 0; e = e.parent()) {
				var ce = e.attr("contentEditable");
				if (ce === "true") {
					return Util.inputElement.CONTENTEDITABLE_ELEMENT;
				}
				if (ce === "false") {
					return Util.inputElement.NOT_INPUT_ELEMENT;
				}
			}
		}

		return Util.inputElement.NOT_INPUT_ELEMENT;
	},

	inputElement: {
		NOT_INPUT_ELEMENT: 0,
		INPUT_ELEMENT: 1,
		CONTENTEDITABLE_ELEMENT: 2,
	}

};

export default Util;
