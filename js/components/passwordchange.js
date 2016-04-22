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
import {csrfToken} from "util";

class PasswordChange extends React.Component {

	static defaultProps = {
		changingPassword: false,
		oldPassword: "",
		newPassword: "",
		newPasswordConfirm: "",
		has2fa: false,
		hasPassword: false,

		onSubmit: noop,
		onToggleClick: noop,
		oldPasswordChange: noop,
		newPasswordChange: noop,
		newPasswordConfirmChange: noop,
		enable2faClick: noop,
		disable2faClick: noop,
		onResetClick: noop,

		enabling2fa: false,
		disabling2fa: false,

		token2fa: "",
		token2faChange: noop,
		pw2fa: "",
		pw2faChange: noop,
		enable2faSubmit: noop,
		enable2faReset: noop,
		disable2faSubmit: noop,
		disable2faReset: noop,
	}

	render() {
		const changePwButtonLabel = this.props.hasPassword ? t("Change password") : t("Add password");
		const changePwButton = this.props.changingPassword ? null : (
			<p>
				<a href="#" onClick={this.props.onToggleClick} className="btn btn-default">{changePwButtonLabel}</a>
			</p>
		);

		const oldPwTextField = this.props.hasPassword ? (
			<TextField label={t("Old password")} id="oldpassword" value={this.props.oldPassword} onChange={this.props.oldPasswordChange} />
		) : null;

		const changePwForm = this.props.changingPassword ? (
			<Form onSubmit={this.props.onSubmit}>
				{oldPwTextField}
				<TextField label={t("New password")} id="newpassword" value={this.props.newPassword} onChange={this.props.newPasswordChange} type="password" />
				<TextField label={t("Confirm password")} id="newpasswordconfirm" value={this.props.newPasswordConfirm} onChange={this.props.newPasswordConfirmChange} type="password" />
				<ButtonSet>
					<ButtonSetButton
						type="submit"
						className="btn-info"
						onClick={() => {}}
						>
						{t("Save")}
					</ButtonSetButton>
					<ButtonSetButton
						type="button"
						className="btn-default"
						onClick={this.props.onResetClick}
						>
						{t("Reset")}
					</ButtonSetButton>
				</ButtonSet>
			</Form>
		) : null;

		let toggle2fa;
		if (this.props.has2fa) {
			if (this.props.disabling2fa) {
				toggle2fa = (
					<Form onSubmit={this.props.disable2faSubmit}>
						<TextField
							id="password"
							label={t("Password")}
							value={this.props.pw2fa}
							onChange={this.props.pw2faChange}
							type="password"
						/>
						<ButtonSet>
							<ButtonSetButton
								type="submit"
								className="btn-danger"
								onClick={() => {}}
								>
								{t("Disable")}
							</ButtonSetButton>
							<ButtonSetButton
								className="btn-default"
								onClick={this.props.disable2faReset}
								>
								{t("Cancel")}
							</ButtonSetButton>
						</ButtonSet>
					</Form>
				);
			} else {
				toggle2fa = (
					<p>
						<a href="#" onClick={this.props.disable2faClick} className="btn btn-danger">{t("Disable 2-factor authentication")}</a>
					</p>
				);
			}
		} else {
			if (this.props.enabling2fa) {
				toggle2fa = (
					<Form onSubmit={this.props.enable2faSubmit}>
						<p><img src={`/api/auth/password/add2fa?token=${csrfToken}&size=500`} /></p>
						<TextField
							label={t("Token")}
							id="2fatoken"
							value={this.props.token2fa}
							onChange={this.props.token2faChange}
						/>
						<ButtonSet>
							<ButtonSetButton
								type="submit"
								className="btn-success"
								onClick={() => {}}
								>
								{t("Verify")}
							</ButtonSetButton>
							<ButtonSetButton
								type="button"
								className="btn-default"
								onClick={this.props.enable2faReset}
								>
								{t("Reset")}
							</ButtonSetButton>
						</ButtonSet>
					</Form>
				);
			} else {
				toggle2fa = (
					<p>
						<a href="#" onClick={this.props.enable2faClick} className="btn btn-info">{t("Enable 2-factor authentication")}</a>
					</p>
				);
			}
		}

		return (
			<div className="row">
				{changePwButton}
				{changePwForm}
				{this.props.hasPassword ? toggle2fa : null}
			</div>
		);
	}

}

export default PasswordChange;
