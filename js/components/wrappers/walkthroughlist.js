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
import WalkthroughList from "components/walkthroughlist";
import WalkthroughStore from "stores/walkthrough";
import WalkthroughActions from "actions/walkthrough";
import connectToStores from "alt/utils/connectToStores";

@connectToStores
class WalkthroughListWrapper extends React.Component {

	static defaultProps = {
		uid: null,
		walkthroughList: [],
		walkthroughuidlist: {},
		empty: null,
	};

	static getStores(props) {
		return [WalkthroughStore];
	}

	static getPropsFromStores(props) {
		return WalkthroughStore.getState();
	}

	componentWillReceiveProps(nextProps) {
		if (this.props.uid != nextProps.uid) {
			setTimeout(() => {
				WalkthroughStore.performList(nextProps.uid);
			}, 0);
		}
	}

	componentDidMount() {
		setTimeout(() => {
			WalkthroughStore.performList(this.props.uid);
		}, 0);
	}

	render() {
		const list = this.props.uid ?
			this.props.walkthroughuidlist[this.props.uid] :
			this.props.walkthroughList;
		return (list && list.length) ? (
			<WalkthroughList walkthroughs={list}>
				{this.props.children}
			</WalkthroughList>
		) : this.props.empty;
	}

}

export default WalkthroughListWrapper;
