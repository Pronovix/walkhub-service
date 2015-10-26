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

class Translator {

	constructor() {
		this.locators = {};
		this.defaultLocator = "";
		this.tries = 0;
	}

	translate(locator) {
		if (!locator) {
			return null;
		}

		var jqobj = null;

		for (var prefix in this.locators) {
			if (this.locators.hasOwnProperty(prefix) && locator.indexOf(prefix + "=") === 0) {
				jqobj = this.locators[prefix](locator.substr(prefix.length + 1));
				break;
			}
		}

		if (!jqobj && !!this.defaultLocator && !!this.locators[this.defaultLocator]) {
			jqobj = this.locators[this.defaultLocator](locator);
		}

		return jqobj;
	}

	translateOrWait(locator, callbacks) {
		var that = this;
		var remainingtries = this.tries;

		function translateOrWaitWorker() {
			var jqobj = that.translate(locator);
			if (jqobj.length > 0) {
				if (callbacks.success) {
					callbacks.success(jqobj);
				}
			}
			else if (Context.locatorTranslationCanWait()) {
				if (callbacks.waiting) {
					callbacks.waiting(that.tries, remainingtries);
				}

				if (that.tries ? (remainingtries > 0) : true) {
					remainingtries--;
					setTimeout(translateOrWaitWorker, 500); // FIXME this never gets scheduled again WHY?
				} else {
					if (callbacks.giveUp) {
						callbacks.giveUp();
					}
				}
			}
			else {
				if (callbacks.giveUp) {
					callbacks.giveUp();
				}
			}
		}

		translateOrWaitWorker();
	}

	addLocatorTranslator(name, callback) {
		this.locators[name] = callback;
		return this;
	}

	setDefaultLocator(name) {
		this.defaultLocator = name;
		return this;
	}

	setRetries(retries) {
		this.tries = retries;
		return this;
	}

	static instanceObject = null;

	static instance() {
		if (!Translator.instanceObject) {
			Translator.instanceObject = new Translator();

			var id = function (arg) {
				return $("#" + arg);
			};

			var name = function (arg) {
				return $("[name=" + arg + "]");
			};

			var xpath = function (arg) {
				var result = null;
				try {
					result = window.document.evaluate(arg, document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
				} catch (ex) {}
				if (result !== null && result.snapshotLength > 0) {
					return $(result.snapshotItem(0));
				}
				return $(""); // empty jquery object
			};

			var css = function (arg) {
				return $(arg);
			};

			Translator.instanceObject
				.addLocatorTranslator("identifier", function (arg) {
					var jq = id(arg);
					if (jq.length === 0) {
						jq = name(arg);
					}
					return jq;
				})
				.addLocatorTranslator("id", id)
				.addLocatorTranslator("name", name)
				.addLocatorTranslator("dom", function (arg) {
					return null;
				})
				.addLocatorTranslator("xpath", xpath)
				.addLocatorTranslator("link", function (arg) {
					return $("a").filter(function () {
						return $(this).text() === arg;
					});
				})
				.addLocatorTranslator("css", css)
				.addLocatorTranslator("ui", function (arg) {
					return null;
				})
				.addLocatorTranslator("default", function (arg) {
					var item = null;
					try {
						item = xpath(arg);
						// Intentional empty catch here.
						// If there's something wrong with the xpath,
						// then it's probably an older selenium test,
						// and it's not an xpath but a css selector.
					} catch (ex) {}
					if (item === null || item.length === 0) {
						item = css(arg);
					}

					return item;
				})
				.setDefaultLocator("default")
				.setRetries(120);
		}

		return Translator.instanceObject;
	}

}

export default Translator;
