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
import WalkhubIframe from "components/walkhub_iframe";
import {t} from "t";
import {noop} from "form";

class HelpCenterList extends React.Component {
	static defaultProps = {
		items: [],
		walkthroughs: {},
		linkClick: noop,
		onClose: noop,
		iframeLink: "",
		iframeTitle: "",
	};

	render() {
		const items = this.props.items.map((item, i) => {
			switch (item.type) {
				case "walkthrough":
					return this.props.walkthroughs[item.uuid] ? (
						<WalkthroughPlay
							key={i}
							walkthrough={this.props.walkthroughs[item.uuid]}
							compact={true}
							linkTo={false}
						/>
					) : (<p key={i}>{t("Loading ...")}</p>);
					break;
				case "iframe":
					const c = (e) => {
						noop(e);
						this.props.linkClick(e, item);
					};
					return (
						<div key={i}>
							<div className="row">
								<div className="col-xs-10 col-md-9">
									<h2>{item.title}</h2>
								</div>
								<div className="col-xs-2 col-md-3">
									<h2>
										<a onClick={c} className="btn btn-info">{t("Open")}</a>
									</h2>
								</div>
							</div>
							<div className="row">
								<div className="col-xs-12">
									<p> {item.description} </p>
								</div>
							</div>
						</div>
					);
					break;
				case "group":
					return (
						<h1 key={i}>{item.group}</h1>
					);
					break;
				default:
					console.log(item);
					break;
				return null;
			}
		}).filter((v) => v);

		const iframe = this.props.iframeLink ? (
			<WalkhubIframe
				onClose={this.props.onClose}
				src={this.props.iframeLink}
				title={this.props.iframeTitle}
			/>
		) : null;

		return (
			<section className="row">
				<div className="col-xs-12">
					{items}
				</div>
				{iframe}
			</section>
		);
	}
}

export default HelpCenterList;
