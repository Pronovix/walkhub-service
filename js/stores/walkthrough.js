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

import flux from "control";
import {createStore, bind} from "alt/utils/decorators";
import WalkthroughActions from "actions/walkthrough";
import WalkthroughSource from "sources/walkthrough";
import URI from "URIjs";

@createStore(flux)
class WalkthroughStore {

	constructor() {
		this.state = {
			walkthroughs: {},
			walkthroughList: [],
			walkthroughuidlist: {},
		};

		this.registerAsync(WalkthroughSource);
	}

	maybeUpdateList() {
		if (this.state.walkthroughList) {
			setTimeout(() => {
				WalkthroughStore.performList();
			}, 500);
		}
	}

	@bind(WalkthroughActions.receivedWalkthroughs)
	receivedWalkthroughs(result) {
		let walkthroughList = result.data;
		const url = URI(result.config.url);
		const uid = url.search(true).uid;
		if (uid) {
			this.state.walkthroughuidlist[uid] = walkthroughList;
		} else {
			this.state.walkthroughList = walkthroughList;
		}
		walkthroughList.forEach((wt) => {
			this.state.walkthroughs[wt.uuid] = wt;
		});
	}

	@bind(WalkthroughActions.listWalkthroughs)
	listWalkthroughs() {
		this.getInstance().performList();
	}

	@bind(WalkthroughActions.receivedWalkthrough)
	receivedWalkthrough(result) {
		let walkthrough = result.data;
		this.state.walkthroughs[walkthrough.uuid] = walkthrough;
	}

	@bind(WalkthroughActions.loadWalkthrough)
	loadWalkthrough(uuid) {
		this.getInstance().performLoad(uuid);
	}

	@bind(WalkthroughActions.createdWalkthrough)
	createdWalkthrough(result) {
		let walkthrough = result.data;
		this.state.walkthroughs[walkthrough.uuid] = walkthrough;
		this.maybeUpdateList();
	}

	@bind(WalkthroughActions.createWalkthrough)
	createWalkthrough(walkthrough) {
		this.getInstance().performPost(walkthrough);
	}

	@bind(WalkthroughActions.updatedWalkthrough)
	updatedWalkthrough(result) {
		const walkthrough = result.data;
		this.state.walkthroughs[walkthrough.uuid] = walkthrough;
		this.maybeUpdateList();
	}

	@bind(WalkthroughActions.updateWalkthrough)
	updateWalkthrough(walkthrough) {
		this.getInstance().performPut(walkthrough);
	}

	@bind(WalkthroughActions.deletedWalkthrough)
	deletedWalkthrough(result) {
		const uuid = result.config.url.split("/").pop();
		delete this.state.walkthroughs[uuid];
		this.maybeUpdateList();
	}

	@bind(WalkthroughActions.deleteWalkthrough)
	deleteWalkthrough(uuid) {
		this.getInstance().performDelete(uuid);
	}
}

export default WalkthroughStore;
