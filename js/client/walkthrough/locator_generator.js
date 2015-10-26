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
import Translator from "client/walkthrough/translator";

const ELEMENT_NODE_TYPE = 1;

class LocatorGenerator {

	constructor() {
		this.locatorGenerators = [];
	}

	addGenerator(generator) {
		this.locatorGenerators.push(generator);
		return this;
	}

	generate(element) {
		for (var i in this.locatorGenerators) {
			if (this.locatorGenerators.hasOwnProperty(i)) {
				var locator = this.locatorGenerators[i](element);
				if (!locator) {
					continue;
				}

				if (LocatorGenerator.isLocatorUnique(locator)) {
					return locator;
				}
			}
		}

		return null;
	}

	static isLocatorUnique(locator) {
		var translated = Translator.instance().translate(locator);
		return translated && translated.length === 1;
	}

	static isLocatorEquals(locator, element) {
		var jqElement = $(element);
		var translated = Translator.instance().translate(locator);
		return jqElement.is(translated) && LocatorGenerator.isLocatorUnique(locator);
	}

	static instanceObject = null;

	static instance() {
		if (LocatorGenerator.instanceObject) {
			return LocatorGenerator.instanceObject;
		}

		LocatorGenerator.instanceObject = new LocatorGenerator();

		LocatorGenerator.instanceObject
			.addGenerator(LocatorGenerator.linkGenerator)
			.addGenerator(LocatorGenerator.idGenerator)
			.addGenerator(LocatorGenerator.nameGenerator)
			.addGenerator(LocatorGenerator.prefixWrapper("css", LocatorGenerator.cssGenerator))
			.addGenerator(LocatorGenerator.prefixWrapper("xpath", LocatorGenerator.htmlXpathGenerator))
			.addGenerator(LocatorGenerator.prefixWrapper("xpath", LocatorGenerator.fullXpathGenerator));

		return LocatorGenerator.instanceObject;
	}

	static linkGenerator(element) {
		var proptagname = element.prop("tagName");
		if (!proptagname) {
			return false;
		}

		if (proptagname.toLowerCase() !== "a") {
			return false;
		}

		if (element.html() !== element.text()) { // No html tags
			return false;
		}

		return "link=" + element.text();
	}

	static idGenerator(element) {
		var id = element.attr("id");
		if (!id) {
			return false;
		}

		if (LocatorGenerator.hashiness(id)) {
			return false;
		}

		return "id=" + id;
	}

	static nameGenerator(element) {
		var name = element.attr("name");
		if (!name) {
			return false;
		}

		if (LocatorGenerator.hashiness(name)) {
			return false;
		}

		return "name=" + name;
	}

	static prefixWrapper(prefix, callback) {
		return function (element) {
			var result = callback(element);

			if (result) {
				return prefix + "=" + result;
			}

			return result;
		};
	}

	static cssGenerator(element) {
		var node = element.get(0);
		var current = node;
		var subPath = LocatorGenerator.getCSSSubpath(node);
		while (!LocatorGenerator.isLocatorEquals("css=" + subPath, node) && current.nodeName.toLowerCase() !== "html") {
			subPath = LocatorGenerator.getCSSSubpath(current.parentNode) + " > " + subPath;
			current = current.parentNode;
		}

		if (LocatorGenerator.isLocatorEquals("css=" + subPath, node)) {
			return subPath;
		}

		return false;
	}

	static getCSSSubpath(node) {
		var cssAttributes = ["id", "name", "class", "type", "alt", "title", "value"];
		for (var i in cssAttributes) {
			if (cssAttributes.hasOwnProperty(i)) {
				var attr = cssAttributes[i];
				var value = node.getAttribute(attr);
				if (value && value.indexOf("walkthrough") === -1) {
					if (attr === "id" && !LocatorGenerator.hashiness(value)) {
						return "#" + value;
					}
					if (attr === "class") {
						var classes = value.trim().split(/\s+/);
						var classstring = "";
						for (var c in classes) {
							if (classes.hasOwnProperty(c) && classes[c] && !LocatorGenerator.hashiness(classes[c])) {
								classstring += "." + classes[c];
							}
						}

						if (classstring) {
							return node.nodeName.toLowerCase() + classstring;
						}
					}

					return node.nodeName.toLowerCase() + "[" + attr + "=\"" + value + "\"]";
				}
			}
		}

		var nodeNumber = LocatorGenerator.getNodeNumber(node);
		if (nodeNumber) {
			return node.nodeName.toLowerCase() + ":nth-of-type(" + nodeNumber + ")";
		}

		return node.nodeName.toLowerCase();
	}

	static getNodeNumber(current) {
		var childNodes = current.parentNode.childNodes;
		var total = 0;
		var index = -1;

		for (var i = 0; i < total; i++) {
			var child = childNodes[i];
			if (child.nodeName === current.nodeName) {
				if (child === current) {
					index = total;
				}
				total++;
			}
		}

		return index;
	}

	static htmlXpathGenerator(element) {
		var node = element.get(0);
		var nodeName = node.nodeName.toLowerCase();

		if (nodeName === "html") {
			return "//html";
		}

		var parent = LocatorGenerator.getXpath(node.parentNode);

		if (parent.indexOf("\"]") > -1) {
			var text = node.textContent.replace(/[']/gm, "&quot;");
			if (text && text.length < 32) {
				var attempt = parent.substr(0, parent.indexOf("\"]") + 2) + "//" + nodeName;

				if (LocatorGenerator.hasNonstandardWhitespace(attempt)) {
					attempt += "[normalize-space(.)=\"" +
						LocatorGenerator.normalizeWhitespace(text) + "\"]";
				} else {
					attempt += "[.=\"" + text + "\"]";
				}

				if (LocatorGenerator.isLocatorEquals("xpath=" + attempt, node)) {
					return attempt;
				}
			}
		}

		return parent + "/" + LocatorGenerator.getChildSelector(node);
	}

	static hasNonstandardWhitespace(text) {
		return !(/^[ \S]*$/.test(text));
	}

	static normalizeWhitespace(text) {
		return text.replace(/\s+/g, " ").trim();
	}

	static fullXpathGenerator(element) {
		var node = element.get(0);
		return LocatorGenerator.getFullXpath(node);
	}

	static getXpath(node) {
		var nodeName = node.nodeName.toLowerCase();

		if (node.id && document.getElementById(node.id) === node && !LocatorGenerator.hashiness(node.id)) {
			return "//" + nodeName + "[@id=\"" + node.id + "\"]";
		}

		var className = node.className;
		if (className && className.indexOf(" ") === -1 && document.getElementsByClassName(className).length === 1 && !LocatorGenerator.hashiness(className)) {
			return "//" + nodeName + "[@class=\"" + className + "]\"";
		}

		if (nodeName === "label" && node.hasAttribute("for")) {
			return "//label[@for=\"" + node.getAttribute("for") + "\"]";
		}

		if (LocatorGenerator.isTopReached(node)) {
			return "//" + LocatorGenerator.getChildSelector(node);
		}

		return LocatorGenerator.getXpath(node.parentNode) + "/" + LocatorGenerator.getChildSelector(node);
	}

	static getFullXpath(node) {
		if (LocatorGenerator.isTopReached(node)) {
			return "//" + LocatorGenerator.getChildSelector(node);
		} else {
			return LocatorGenerator.getFullXpath(node.parentNode) + "/" + LocatorGenerator.getChildSelector(node);
		}
	}

	static isTopReached(node) {
		return node.nodeName === "body" || node.nodeName === "html" || !node.parentNode || node.parentNode.nodeName.toLowerCase() === "body";
	}

	static getChildSelector(node) {
		var count = 1;
		var sibling = node.previousSibling;
		while (sibling) {
			if (sibling.nodeType === ELEMENT_NODE_TYPE && sibling.nodeName === node.nodeName) {
				count++;
			}
			sibling = sibling.previousSibling;
		}

		if (count === 1) {
			var onlyNode = true;
			sibling = node.nextSibling;
			while (sibling) {
				if (sibling.nodeType === ELEMENT_NODE_TYPE && sibling.nodeName === node.nodeName) {
					onlyNode = false;
					break;
				}
				sibling = sibling.nextSibling;
			}
			if (onlyNode) {
				return node.nodeName.toLowerCase();
			}
		}

		return node.nodeName.toLowerCase() + "[" + count + "]";
	}

	static hashiness(str) {
		const hashlengths = [32, 40, 64, 128, 256, 512];

		if (str.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi)) {
			return true;
		}

		for (var i in hashlengths) {
			if (hashlengths.hasOwnProperty(i)) {
				if (str.match(new RegExp("[0-9a-f]{" + hashlengths[i] + "}", "gi"))) {
					return true;
				}
			}
		}

		for (var id in LocatorGenerator.customIDs) {
			if (LocatorGenerator.customIDs.hasOwnProperty(id)) {
				if (str.match(LocatorGenerator.customIDs[id])) {
					return true;
				}
			}
		}

		return false;
	}

	static customIDs = {
		DrupalNodeID: /^node-[\d]+$/gi
	}

}

export default LocatorGenerator;
