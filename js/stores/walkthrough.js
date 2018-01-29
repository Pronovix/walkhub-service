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
import URI from "urijs";

@createStore(flux)
class WalkthroughStore {

	constructor() {
		this.state = {
			walkthroughs: {},
			walkthroughList: [],
			walkthroughuidlist: {},
			siteinfos: {},
			loadingSiteinfos: {},
			mysites: null,
			screenings: {},
			recordSaved: false,
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

	@bind(WalkthroughActions.creatingWalkthrough)
	creatingWalkthrough() {
		this.state.recordSaved = false;
	}

	@bind(WalkthroughActions.createdWalkthrough)
	createdWalkthrough(result) {
		let walkthrough = result.data;
		this.state.walkthroughs[walkthrough.uuid] = walkthrough;
		this.state.recordSaved = true;
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

	@bind(WalkthroughActions.receivedSiteinfo)
	receivedSiteinfo(result) {
		this.state.loadingSiteinfos[result.data.url] = false;
		this.state.siteinfos[result.data.url] = result.data;
	}

	@bind(WalkthroughActions.receivedMySites)
	receivedMySites(result) {
		this.state.mysites = result.data;
	}

	cacheScreening(result, screening) {
		const wid = result.config.url.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i)[0];
		const ct = result.headers["content-type"];
		this.state.screenings[wid] = this.state.screenings[wid] || {};
		this.state.screenings[wid][ct] = screening;
	}

	@bind(WalkthroughActions.receivedScreening)
	receivedScreening(result) {
		const screening = result.data;
		this.cacheScreening(result, screening);
	}

	@bind(WalkthroughActions.loadingScreeningFailed)
	loadingScreeningFailed(result) {
		this.cacheScreening(result, []);
	}
}

export default WalkthroughStore;
