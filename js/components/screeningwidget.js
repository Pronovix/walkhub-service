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

class ScreeningWidget extends React.Component {
	static defaultProps = {
		walkthrough: {},
		screening: [],
		currentImage: 0,
		showImages: false,
		nextButtonClick: noop,
		prevButtonClick: noop,
		nextButtonEnabled: false,
		prevButtonEnabled: false,
		onClick: noop,
		onMouseEnter: noop,
		onMouseLeave: noop,
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
			<div className="row screening-button">
				<div className="col-xs-12 text-right">
					<a className="btn btn-primary" onClick={this.context.screenWalkthrough}>{t("Update your Walkthrough GIF")}</a>
				</div>
			</div>
		) : null;

		const content = this.props.showImages ? (
			<div onClick={this.props.onClick} onMouseEnter={this.props.onMouseEnter} onMouseLeave={this.props.onMouseLeave} className={this.context.screenWalkthrough ? "has-screening-button" : ""}>
				{screeningButton}
				<img
					className="slideshow-image"
					src={imageURL}
				/>
				<div className="slideshow">
					<div className="row text-bar">
						<h4 className="col-xs-12">
							{step.title ? step.title : "\u00a0"}
						</h4>
					</div>
					<div className="row control-bar">
						<div className="col-xs-6 control-prev">
							<a
								className="btn btn-default"
								disabled={this.props.prevButtonEnabled ? "" : "disabled"}
								onClick={this.props.prevButtonEnabled ? this.props.prevButtonClick : noop}
								>
								{t("Prev")}
							</a>
						</div>
						<div className="col-xs-6 control-next">
							<a
								className="btn btn-default"
								disabled={this.props.nextButtonEnabled ? "" : "disabled"}
								onClick={this.props.nextButtonEnabled ? this.props.nextButtonClick : noop}
								>
								{t("Next")}
							</a>
						</div>
					</div>
				</div>
			</div>
		) : this.props.children;

		return (
			<div className="row screening-widget">
				<div className="col-xs-12">
					{content}
				</div>
			</div>
		);
	}
}

export default ScreeningWidget;
