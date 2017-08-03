// Walkhub
// Copyright (C) 2016 Pronovix
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
import {capitalizeFirstLetter, split} from "util";
import {t} from "t";
import Translator from "client/walkthrough/translator";

class AutoTitle {

	titleAndDescription(command, locator, value = "") {
		const [sentence, paragraph, params] = this.locatorToSentence(command, locator);
		const verb = this.commandToVerb(command);

		params["verb"] = t(verb);
		params["value"] = value;

		return [t(sentence, params), t(paragraph, params)];
	}

	commandToVerb(command) {
		return capitalizeFirstLetter(command);
	}

	locatorToSentence(command, locator) {
		const [prefix, argument] = split(locator, "=", 2);
		let generator = this.sentenceGenerators[prefix];
		return generator ?
			generator(command, prefix, argument) :
			this.defaultSentenceGenerator(command, prefix, argument);
	}

	sentenceGenerators = {};

	linkSentenceGenerator(command, prefix, argument) {
		return [
			N_("{verb} on {argument}"),
			"",
			{
				"argument": argument,
			},
		];
	}

	defaultSentenceGenerator(command, prefix, argument) {
		const elem = Translator.instance().translate(prefix+"="+argument);
		const label = this.getLabel(elem);
		return [
			N_("{verb} in {label}"),
			"",
			{
				"label": label,
			},
		];
	}

	getLabel(item) {
		let text = item.text();
		if (text) {
			return text;
		}

		const parentform = item.parents("form");
		const parent = item.parent();
		const id = item.attr("id");
		const name = item.attr("name");
		if (parentform.length) {
			const name = item.attr("name");
			if (parent.is("label")) {
				text = parent.text();
				if (text) {
					return text;
				}
			}

			let label = id && $("label[for="+id+"]", parentform);
			if (!label || !label.length) {
				label = name && $("label[for="+name+"]", parentform);
			}
			if (label && label.length) {
				text = parent.text();
				if (text) {
					return text;
				}
			}
		}

		return "";
	}

	constructor() {
		this.sentenceGenerators["link"] = this.linkSentenceGenerator;
	}

	static instanceObject = null;

	static instance() {
		if (!AutoTitle.instanceObject) {
			AutoTitle.instanceObject = new AutoTitle();
		}

		return AutoTitle.instanceObject;
	}
}

export default AutoTitle;
