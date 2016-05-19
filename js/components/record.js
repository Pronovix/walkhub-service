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
import {t} from "t";
import {noop, Form, TextField, Radios, Button, ButtonSet, ButtonSetButton} from "form";
import EmbedCode from "components/embedcode";

import recordIcon from "images/record.svg";

class Record extends React.Component {

	static defaultProps = {
		embedded: false,
		steps: [],

		title: "",
		onTitleChange: noop,

		startingUrl: "",
		onStartingUrlChange: noop,
		onStartingUrlBlur: () => {},
		recordDisabled: false,
		compatibilityWarning: false,

		onRecordClick: noop,
		onSaveClick: noop,
		onResetClick: noop,
	};

	render() {
		const steps = this.props.steps.map((step, index) => {
			return <li key={index}>{step.cmd+"("+(step.arg0?`"${step.arg0}"`:"")+(step.arg1?`, "${step.arg1}"`:"")+")"}</li>;
		});

		const hasSteps = !!this.props.steps.length;

		const reset = hasSteps ?
			<ButtonSetButton onClick={this.props.onResetClick} className="btn-default">{t("Reset")}</ButtonSetButton> :
			null;

		const embed = this.props.embedded ? null : (
			<div className="row">
				<div className="col-sm-offset-2 col-sm-10">
					<h3> {t("Recorder embed code")} </h3>
				</div>
				<div className="col-sm-offset-2 col-sm-10">
					<EmbedCode />
				</div>
			</div>
		);

		const recordButtonClass = "btn-danger btn-record-" + this.props.embedded;

		const compatWarn = this.props.compatibilityWarning ? (
			<p className="text-warning">{t("The site might not be compatible with this walkhub")}</p>
		) : null;

		return (
			<section className={"wh-record " + (this.props.embedded ? "embedded" : "container") + (hasSteps ? " has-steps" : " no-steps")}>
				<h1> {t("Record walkthrough")} </h1>
				<Form>
					<TextField id="input-title" label={t("Title")} value={this.props.title} onChange={this.props.onTitleChange} />
					<TextField id="input-starting-url" label={t("Starting URL")} value={this.props.startingUrl} onChange={this.props.onStartingUrlChange} onBlur={this.props.onStartingUrlBlur} />
					{compatWarn}
					<Button grid={!this.props.embedded} onClick={this.props.onRecordClick} disabled={this.props.recordDisabled} containerClassName="record" className={recordButtonClass}><strong>{t("Record")}</strong> <span><object className="record-icon" type="image/svg+xml" data={recordIcon}></object></span></Button>
					<div className="form-group steps">
						<h3 className="col-sm-offset-2 col-sm-10">{t("Recorded steps")}</h3>
						<div className="col-sm-offset-2 col-sm-10">
							<ul>{steps}</ul>
						</div>
					</div>
					<ButtonSet className="save">
						<ButtonSetButton onClick={this.props.onSaveClick} disabled={this.props.steps.length === 0} type="submit" className="btn-success">{t("Save")}</ButtonSetButton>
						{reset}
					</ButtonSet>
				</Form>
				{embed}
			</section>
		);
	}

}

export default Record;
