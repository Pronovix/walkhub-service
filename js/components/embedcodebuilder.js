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
import EmbedCode from "components/embedcode";
import {noop} from "form";
import {t, N_} from "t";
import URI from "urijs";

class EmbedCodeBuilder extends React.Component {

	static defaultProps = {
		url: "",
		email: "",
		record: true,
		search: true,
		position: "none",
		showCode: false,
		showAdvanced: false,
		enableAdvanced: true,
		urlHasError: false,

		generateClick: noop,
		resetClick: noop,
		advancedClick: noop,
		urlChange: noop,
		emailChange: noop,
		positionChange: noop,
		recordCheck: noop,
		searchCheck: noop,
	};

	render() {
		let advancedSettings = null;
		if (this.props.enableAdvanced && !this.props.showCode) {
			if (this.props.showAdvanced) {
				N_("none"); N_("bottom right"); N_("bottom left"); N_("top right"), N_("top left");
				const positions = ["none", "bottom-right", "bottom-left", "top-right", "top-left"].map((position) => {
					const label = t(position.replace("-", " "));
					return (
						<div className="radio" key={position}>
							<label>
								<input type="radio" name="position" value={position} checked={position === this.props.position} onChange={this.props.positionChange} />
								{label}
							</label>
						</div>
					);
				});
				advancedSettings = (
					<div className="form-group">
						<p>
							<label>
								<input type="checkbox" name="record" checked={this.props.record} onChange={this.props.recordCheck} />
								&nbsp;{t("Record button")}
							</label>
						</p>
						<p>
							<label>
								<input type="checkbox" name="search" checked={this.props.search} onChange={this.props.searchCheck} />
								&nbsp;{t("Help center")}
							</label>
						</p>
						<p>
							{t("Position")}<br />
							{positions}
						</p>
					</div>
				);
			} else {
				advancedSettings = <a href="#" onClick={this.props.advancedClick}>{t("Advanced settings")}</a>;
			}
		}

		let embedparams = {
			script: this.props.record || this.props.search,
			buttons: [],
			autoselect: true,
		};
		if (this.props.search) {
			embedparams.buttons.push({
				search: URI(this.props.url).hostname(),
			});
		}
		if (this.props.record) {
			embedparams.buttons.push({});
		}
		if (this.props.position !== "none") {
			embedparams.position = this.props.position;
		}

		const codealert = <div className="alert alert-info">{t("To enable WalkHub, you need to place this code so that it will be rendered on every page")}</div>;

		const code = this.props.showCode ? (
			<div className="embed-code">
				<EmbedCode {...embedparams} />
				{codealert}
			</div>
		) : (
			<div className="embed-code">
				<pre className="empty-embed-code">{"\n\n\n\n\n\n"}</pre>
			</div>
		);

		const urlHelpBlock = this.props.urlHasError ?
			<span className="help-block">{t("Invalid url")}</span> :
			null;

		const button = this.props.showCode ?
			(
				<a href="#" onClick={this.props.resetClick} className="btn btn-warning">{t("Reset form")}</a>
			) :
			(
				<a href="#" onClick={this.props.generateClick} className="btn btn-success">{t("Generate my code!")}</a>
			);

		return (
			<form className="embed-code-builder">
				<div className="row">
					<div className="col-xs-12">
						<h4>{t("Generate your personalized embed code to record and play walkthroughs")}</h4>
					</div>
				</div>
				<div className="row">
					<div className="col-xs-4">
						<p className={"form-group" + (this.props.urlHasError ? " has-error" : "")}><input type="text" className="form-control" name="url" value={this.props.url} onChange={this.props.urlChange} placeholder={t("website url")} />{urlHelpBlock}</p>
						<p><input type="text" className="form-control" name="email" value={this.props.email} onChange={this.props.emailChange} placeholder={t("email")} /></p>
						<p>{advancedSettings}</p>
						<p>{button}</p>
					</div>
					<div className="col-xs-8">
						{code}
					</div>
				</div>
			</form>
		);
	}

}

export default EmbedCodeBuilder;
