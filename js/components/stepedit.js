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
import {noop, TextField, TextArea, CheckBox} from "form";
import {t} from "t";

class StepEdit extends React.Component {

	static defaultProps = {
		step: {},
		item: -1,

		onTitleChange: noop,
		onDescriptionChange: noop,
		onHighlightChange: noop,
		onCommandChange: noop,
		onArg0Change: noop,
		onArg1Change: noop,
	};

	wrapCallback = (callback) => {
		return (evt) => {
			callback(evt, this.props.item);
		};
	};

	render() {
		const step = this.props.step;

		return (
			<fieldset className={`wh-edit-step wh-edit-step-${this.props.item}`}>
				<TextField id="input-title" label={t("Title")} value={step.title} onChange={this.wrapCallback(this.props.onTitleChange)} />
				<TextArea id="input-description" label={t("Description")} value={step.description} onChange={this.wrapCallback(this.props.onDescriptionChange)} />
				<TextField id="input-highlight" label={t("Highlight")} value={step.highlight} onChange={this.wrapCallback(this.props.onHighlightChange)} />
				<TextField id="input-command" label={t("Command")} value={step.cmd} onChange={this.wrapCallback(this.props.onCommandChange)} />
				<TextField id="input-arg0" label={t("First argument")} value={step.arg0} onChange={this.wrapCallback(this.props.onArg0Change)} />
				<TextField id="input-arg1" label={t("Second argument")} value={step.arg1} onChange={this.wrapCallback(this.props.onArg1Change)} />
			</fieldset>
		);
	}

}

export default StepEdit;
