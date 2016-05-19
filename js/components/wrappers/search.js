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
import HelpButton from "components/helpbutton";
import Search from "components/search";
import SearchStore from "stores/search";
import SearchActions from "actions/search";
import connectToStores from "alt/utils/connectToStores";
import WalkhubBackend from "walkthrough/walkhub_backend";
import Bar from "components/bar";
import {noop} from "form";
import {t} from "t";

@connectToStores
class SearchWrapper extends React.Component {

	static getStores(props) {
		return [SearchStore];
	}

	static getPropsFromStores(props) {
		return SearchStore.getState();
	}

	static defaultProps = {
		results: {},
	};

	static contextTypes = {
		location: React.PropTypes.shape,
	};

	isEmbedded() {
		return !!this.context.location.query.embedded;
	}

	state = {
		search: "",
		lastSearch: "",
		helpButton: false,
	};

	onSearchClick = (evt) => {
		this.setState({
			lastSearch: this.state.search,
		});
		SearchStore.performSearch(this.state.search);
	};

	onSearchChange = (evt) => {
		this.setState({search: evt.target.value});
	};

	onSearchKeyDown = (evt) => {
		if (evt.keyCode === 13) {
			this.onSearchClick(null);
		}
	};

	onHelpClick = (evt) => {
		this.setState({helpButton: false});
		WalkhubBackend.embedSetListState();
	};

	onBarCloseClick = (evt) => {
		noop(evt);
		this.setState({helpButton: true});
		WalkhubBackend.embedResetState();
	};

	componentWillMount() {
		this.setState({
			search: this.context.location.query.q,
			helpButton: this.isEmbedded(),
		});
	}

	componentDidMount() {
		if (this.state.search) {
			this.onSearchClick();
		}
	}

	render() {
		if (this.state.helpButton) {
			return <HelpButton helpClick={this.onHelpClick} />;
		}

		const bar = this.isEmbedded() ? (
			<Bar
				brand={t("Help")}
				onClose={this.onBarCloseClick}
			/>
		) : null;

		return (
			<div>
				{bar}
				<Search
					results={this.props.results[this.state.lastSearch]}
					search={this.state.search}
					lastSearch={this.state.lastSearch}
					onSearchClick={this.onSearchClick}
					onSearchChange={this.onSearchChange}
					onSearchKeyDown={this.onSearchKeyDown}
					embedded={this.isEmbedded()}
				/>
			</div>
		);
	}

}

export default SearchWrapper;
