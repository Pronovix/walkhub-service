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

class Frontpage extends React.Component {

	static defaultProps = {
		walkthroughs: [],
	};

	render() {
		const walkthroughs = this.props.walkthroughs.map((walkthrough) => {
			return <WalkthroughPlay key={walkthrough.uuid} walkthrough={walkthrough} compact={true} />;
		});

		return (
			<section className="row">
				<div className="col-xs-12">
					<h1> Welcome to Walkhub! </h1>
					{walkthroughs}
				</div>
			</section>
		);
	}

}

export default Frontpage;
