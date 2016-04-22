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
import {t} from "t";
import {noop, TextField, ButtonSet, ButtonSetButton, Button, Form} from "form";

class ProfileEdit extends React.Component {

	static defaultProps = {
		editing: false,

		name: "",
		mail: "",

		editingToggleClick: noop,
		onSubmit: noop,
		onNameChange: noop,
		onMailChange: noop,
		onResetClick: noop,
	};

	render() {
		if (!this.props.editing) {
			return <a href="#" onClick={this.props.editingToggleClick} className="btn btn-default">{t("Edit profile")}</a>;
		}

		return (
			<Form onSubmit={this.props.onSubmit}>
				<TextField
					id="name"
					label={t("Name")}
					value={this.props.name}
					onChange={this.props.onNameChange}
				/>
				<TextField
					id="mail"
					label={t("Mail")}
					value={this.props.mail}
					onChange={this.props.onMailChange}
				/>
				<ButtonSet>
					<ButtonSetButton
						type="submit"
						onClick={() => {}}
						id="profileEditSubmit"
						className="btn-success"
						>
						{t("Save")}
					</ButtonSetButton>
					<ButtonSetButton
						id="profileEditReset"
						onClick={this.props.onResetClick}
						className="btn-default"
						>
						{t("Reset")}
					</ButtonSetButton>
				</ButtonSet>
			</Form>
		);
	}

}

export default ProfileEdit;
