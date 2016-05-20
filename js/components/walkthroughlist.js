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

import React from "react";
import WalkthroughPlay from "components/wrappers/walkthroughplay";
import {noop} from "form";
import Collapsible from "components/collapsible";

class WalkthroughList extends React.Component {

	static defaultProps = {
		walkthroughs: [],
		mysites: [],
		groupBySite: false,
	};

	renderWalkthrough(walkthrough) {
		return <WalkthroughPlay key={walkthrough.uuid} walkthrough={walkthrough} compact={true} />;
	}

	renderList() {
		return this.props.walkthroughs.map(this.renderWalkthrough);
	}

	renderGroups() {
		if (this.props.mysites === null) {
			return null;
		}

		return this.props.mysites.map((site) => {
			const list =
				this.props.walkthroughs.filter((walkthrough) => {
					try {
						return walkthrough.steps[0].arg0 === site;
					} catch (ex) {
						return false;
					}
				}).map(this.renderWalkthrough);

			return (
				<div className="row">
					<Collapsible title={site} isExpanded={false}>
						{list}
					</Collapsible>
				</div>
			);
		});
	}

	render() {
		const content = this.props.groupBySite ?
			this.renderGroups() :
			this.renderList();

		return (
			<section className="row">
				<div className="col-xs-12">
					{this.props.children}
					{content}
				</div>
			</section>
		);
	}

}

export default WalkthroughList;
