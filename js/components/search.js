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
import EmbedCode from "components/embedcode";
import noop from "form";
import {t} from "t";

class Search extends React.Component {

	static defaultProps = {
		results: [],
		search: "",
		lastSearch: "",
		onSearchClick: noop,
		onSearchChange: noop,
		onSearchKeyDown: null,
		embedded: false,
	};

	render() {
		const embedded = this.props.embedded;
		const search = embedded ? null : (
			<section className="row">
				<div className="col-xs-12">
					<div className="input-group">
						<input type="text" className="form-control" onChange={this.props.onSearchChange} onKeyDown={this.props.onSearchKeyDown} value={this.props.search} />
						<div className="input-group-btn">
							<button type="button" className="btn btn-default" onClick={this.props.onSearchClick}>{t("Search")}</button>
						</div>
					</div>
				</div>
			</section>
		);

		const results = this.props.results.map((result) => {
			if (result.type === "walkthrough") {
				return (
					<WalkthroughPlay
						key={result.entity.uuid}
						walkthrough={result.entity}
						compact={true}
						linkTo={!embedded}
					/>
				);
			}

			return null;
		}).filter((v) => !!v);

		const embed = !this.props.embedded && this.props.lastSearch ? (
			<div className="row">
				<div className="col-xs-4">
					<h3> {t("Embed these results")} </h3>
				</div>
				<div className="col-xs-8">
					<EmbedCode search={this.props.lastSearch} />
				</div>
			</div>
		) : null;

		return (
			<div>
				{search}
				<section className="row">
					<div className="col-xs-12">
						{results}
					</div>
				</section>
				{embed}
			</div>
		);
	}

}

export default Search;
