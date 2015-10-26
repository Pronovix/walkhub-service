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
import Executor from "client/walkthrough/executor";

class Walkhub {
	static instance = null;

	static getInstance() {
		if (Walkhub.instance === null) {
			Walkhub.instance = new Walkhub();
		}
		return Walkhub.instance
	}

	static logParams() {
		console.log(arguments);
	}

	constructor() {
		this.currentExecutor = new Executor();
		this.initialized = false;
	}
}

export default Walkhub;
