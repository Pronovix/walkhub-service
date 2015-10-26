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
import {noop, Form, TextField, TextArea, Radios, ButtonSet, ButtonSetButton} from "form";
import StepEdit from "components/stepedit";
import {t} from "t";
import {severities} from "util";

class WalkthroughEdit extends React.Component {

	static defaultProps = {
		walkthrough: {},
		onCancelClick: noop,
		onSaveClick: noop,

		onNameChange: noop,
		onSeverityChange: noop,
		onDescriptionChange: noop,

		onStepTitleChange: noop,
		onStepDescriptionChange: noop,
		onStepHighlightChange: noop,
		onStepCommandChange: noop,
		onStepArg0Change: noop,
		onStepArg1Change: noop,
	};

	render() {
		const walkthrough = this.props.walkthrough;
		let counter = 0;
		const steps = walkthrough.steps ?
			walkthrough.steps.map((step) => {
				const c = counter++;
				return (
					<div key={c} className="row">
						<div className="col-xs-12">
							<StepEdit
								step={step}
								item={c}
								onTitleChange={this.props.onStepTitleChange}
								onDescriptionChange={this.props.onStepDescriptionChange}
								onHighlightChange={this.props.onStepHighlightChange}
								onCommandChange={this.props.onStepCommandChange}
								onArg0Change={this.props.onStepArg0Change}
								onArg1Change={this.props.onStepArg1Change}
							/>
						</div>
					</div>
				);
			}):
			null;

		return (
			<section className={`wh-edit walkthrough-uuid-${walkthrough.uuid} walkthrough-revision-${walkthrough.uuid}`}>
				<h1> {t("Edit walkthrough")} </h1>
				<Form>
					<TextField id="input-name" label={t("Name")} value={walkthrough.name} onChange={this.props.onNameChange} />
					<Radios name="input-severity" checked={walkthrough.severity} options={severities} onChange={this.props.onSeverityChange} />
					<TextArea id="input-description" label={t("Description")} value={walkthrough.description} onChange={this.props.onDescriptionChange} />
					<div className="row">
						<div className="col-xs-12">
							<h3> Steps </h3>
						</div>
					</div>
					{steps}
					<ButtonSet>
						<ButtonSetButton onClick={this.props.onCancelClick} className="btn-danger">{t("Cancel")}</ButtonSetButton>
						<ButtonSetButton onClick={this.props.onSaveClick} type="submit" className="btn-success">{t("Save")}</ButtonSetButton>
					</ButtonSet>
				</Form>
			</section>
		);
	}

}

export default WalkthroughEdit;
