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
import Util from "client/walkthrough/util";
import Walkhub from "client/walkhub";
import CryptoJS from "crypto-js";
import URI from "URIjs";

class CommandDispatcher {

	constructor() {
		this.commands = {};
		this.aliases = {};
	}

	addCommand(name, init, execute, automatic) {
		this.commands[name] = {
			init: init,
			execute: execute,
			automatic: !!automatic
		};
		return this;
	}

	addAlias(alias, command) {
		this.aliases[alias] = command;
		return this;
	}

	resolve(command) {
		var realCommand = this.aliases[command] || command;
		return this.commands[realCommand];
	}

	initCommand(command, step, onStepComplete) {
		var resolvedCommand = this.resolve(command);
		if (resolvedCommand) {
			resolvedCommand.init(step, onStepComplete);
		}
	}

	executeCommand(command, step) {
		var resolvedCommand = this.resolve(command);
		if (resolvedCommand) {
			resolvedCommand.execute(step);
		}
	}

	isAutomaticCommand(command) {
		var realCommand = this.resolve(command);
		return realCommand.automatic;
	}

	static instanceObject = null;

	static instance() {
		if (!CommandDispatcher.instanceObject) {
			CommandDispatcher.instanceObject = new CommandDispatcher();

			CommandDispatcher.instanceObject
				.addCommand("click",
					function (step, onStepCompleteCallback) {
						Translator.instance().translate(step.arg0)
							.unbind("click.walkhub")
							.bind("click.walkhub", onStepCompleteCallback);
					},
					function (step) {
						var element = Translator.instance().translate(step.arg0);
						var raw = element.get(0);
						raw.click();
					})
				.addCommand("type",
					function (step, onStepCompleteCallback) {
						Translator.instance().translate(step.arg0)
							.unbind("change.walkhub")
							.bind("change.walkhub", onStepCompleteCallback);
					},
					function (step) {
						var element = Translator.instance().translate(step.arg0);
						switch (Util.isInputElement(element)) {
							case Util.inputElement.NOT_INPUT_ELEMENT:
								break;
							case Util.inputElement.INPUT_ELEMENT:
								element
									.val(step.arg1)
									.keydown()
									.keyup()
									.change();
								break;
							case Util.inputElement.CONTENTEDITABLE_ELEMENT:
								element.html(Util.filterXSS(step.arg1));
								break;
						}
					})
				.addCommand("select",
					function (step, onStepCompleteCallback) {
						var element = Translator.instance().translate(step.arg0);
						element
							.unbind("change.walkhub")
							.bind("change.walkhub", onStepCompleteCallback);
					},
					function (step) {
						var element = Translator.instance().translate(step.arg0);
						var value = CommandDispatcher.getValueForSelectOption(element, step.arg1);
						element
							.val(value)
							.change();
					})
				.addCommand("open",
					function (step, onStepCompleteCallback) {},
					function (step) {
						var url = step.arg0;
						var httpProxy = Walkhub.getInstance().currentExecutor.getController().getHTTPProxyURL();
						if (httpProxy) {
							var uri = new URI(url);
							var protocol = uri.protocol() || "http";
							var hostname = uri.hostname();
							var port = uri.port() || "80";
							var proxyuri = new URI(httpProxy);
							var proxyhostname = proxyuri.hostname();
							proxyuri
								.hostname(CryptoJS.MD5(protocol + "." + hostname + "." + port) + "." + proxyhostname)
								.search({url: url});
							window.location = proxyuri.toString();
						} else {
							window.location = url;
						}
					}, true)
				.addCommand("",
					function (step, onStepCompleteCallback) {},
					function (step, onStepCompleteCallback) {}
				)
				.addAlias("sendKeys", "type");
		}

		return CommandDispatcher.instanceObject;
	}

	static getValueForSelectOption(element, value) {
		var types = {
			"label": function (val) {
				var ret = null;
				element.find("option").each(function () {
					if ($(this).attr("label") === val) {
						ret = $(this);
					}
					if ($(this).html() === val) {
						ret = $(this);
					}
				});
				return ret;
			},
			"value": function (val) {
				var ret = null;
				element.find("option").each(function () {
					if ($(this).attr("value") === val) {
						ret = $(this);
					}
					if ($(this).html() === val) {
						ret = $(this);
					}
				});
				return ret;
			},
			"id": function (val) {
				return element.find("option#" + val);
			},
			"index": function (val) {
				return element.find("option:nth-child(" + val + ")");
			}
		};

		var option;

		for (var prefix in types) {
			if (types.hasOwnProperty(prefix) && value.indexOf(prefix + "=") === 0) {
				option = types[prefix](value.substr(prefix.length + 1));
				break;
			}
		}

		if (!option) {
			option = types.label(value);
		}

		if (!option) {
			return null;
		}

		return option.attr("value") || option.html();
	}
}

export default CommandDispatcher;
