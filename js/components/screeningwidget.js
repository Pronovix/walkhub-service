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

import React from "react";
import {noop} from "form";
import {sprintf} from "sprintf-js";
import {t} from "t";
import logo from "images/walkhub-navbar-logo-grey.svg";

class ScreeningWidget extends React.Component {
	static defaultProps = {
		walkthrough: {},
		screening: [],
		currentImage: 0,
		showBars: false,
		nextButtonClick: noop,
		prevButtonClick: noop,
		fullscreenClick: noop,
		shareClick: noop,
		nextButtonEnabled: false,
		prevButtonEnabled: false,
		onClick: noop,
		onMouseEnter: noop,
		onMouseLeave: noop,
		sharing: false,
	};

	static contextTypes = {
		playWalkthrough: React.PropTypes.func,
		screenWalkthrough: React.PropTypes.func,
	};

	render() {
		if (!this.props.walkthrough.uuid || this.props.screening.length === 0) {
			return this.context.screenWalkthrough ? (
				<div className="row">
					<div className="col-xs-12 text-center">
						<a className="btn btn-primary" onClick={this.context.screenWalkthrough}>{t("Create your Walkthrough GIF")}</a>
					</div>
				</div>
			) : null;
		}

		const imageURL = this.props.screening[this.props.currentImage];
		const step = this.props.walkthrough.steps ?
			this.props.walkthrough.steps[this.props.currentImage+1]:
			{};

		const screeningButton = this.context.screenWalkthrough ? (
			<a className="btn btn-primary" onClick={this.context.screenWalkthrough}>{t("Update your Walkthrough GIF")}</a>
		) : null;

		const topbar = this.props.showBars && !this.props.sharing ? (
			<div className="row screening-button">
				<h4 className="col-xs-8 text-left">
					{`${this.props.walkthrough.name} (${this.props.currentImage+1}/${this.props.screening.length})`}
				</h4>
				<div className="col-xs-4 text-right">
					{screeningButton}
				</div>
			</div>
		) : null;

		const bottombar = this.props.showBars && !this.props.sharing ? (
			<div className="slideshow">
				<div className="row control-bar">
					<div className="col-xs-4 text-left">
						<a className="logo" href={WALKHUB_URL} target="_blank">
							<img src={logo} />
						</a>
					</div>
					<div className="col-xs-4 text-center">
						<a
							className="slideshow-button"
							disabled={this.props.prevButtonEnabled ? "" : "disabled"}
							onClick={this.props.prevButtonEnabled ? this.props.prevButtonClick : noop}
							>
							{"<"}
						</a>
						{"\u00a0"}
						<a
							className="slideshow-button"
							disabled={this.props.nextButtonEnabled ? "" : "disabled"}
							onClick={this.props.nextButtonEnabled ? this.props.nextButtonClick : noop}
							>
							{">"}
						</a>
					</div>
					<div className="col-xs-4 text-right">
						<a
							className="slideshow-button slideshow-button-share"
							onClick={this.props.shareClick}
							>
							<i className="fa fa-share-alt-square" aria-hidden="true"></i>
						</a>
						<a
							className="slideshow-button slideshow-button-fullscreen"
							onClick={this.props.fullscreenClick}
							>
							<i className="fa fa-arrows-alt" aria-hidden="true"></i>
						</a>
					</div>
				</div>
			</div>
		) : null;

		let classes = ["screening-widget"];
		if (this.context.screenWalkthrough) {
			classes.push("has-screening-button");
		}
		if (this.props.showBars) {
			classes.push("showing-bars");
		}

		const style = {
			backgroundImage: `url(${imageURL})`,
		};

		const embedcode = `<iframe width="990" height="540" src="`+WALKHUB_URL+`walkthrough/${this.props.walkthrough.uuid}?embedded=1&screening_only=1&autoadvance=2000"></iframe>`;

		const sharingMouseEvt = (evt) => {
			evt.stopPropagation();
		};

		const sharing = this.props.sharing ? (
			<div className="screening-sharing">
				<pre onClick={sharingMouseEvt} onMouseDown={sharingMouseEvt} ref="embedbox" className="walkthrough-embedcode">{embedcode}</pre>
			</div>
		) : null;

		const content = (
			<div
				onClick={this.props.onClick}
				onMouseDown={(evt) => { evt.preventDefault(); }}
				onMouseEnter={this.props.onMouseEnter}
				onMouseLeave={this.props.onMouseLeave}
				className={classes.join(" ")}
				style={style}
				>
				{topbar}
				{sharing}
				{bottombar}
			</div>
		);

		return (
			<div className="row screening-widget">
				<div className="col-xs-12 screening-widget-inner">
					{content}
				</div>
			</div>
		);
	}
}

export default ScreeningWidget;
