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

class ProfileEdit extends React.Component {

	static defaultProps = {
		name: "",
		mail: "",
		oldPassword: "",
		newPassword: "",
		newPasswordConfirm: "",
		has2fa: false,
		hasPassword: false,
		code2fa: "",
		pw2fa: "",
		enabling2fa: false,
		disabling2fa: false,

		onSubmit: noop,
		onNameChange: noop,
		onMailChange: noop,
		onCancelClick: noop,
		oldPasswordChange: noop,
		newPasswordChange: noop,
		newPasswordConfirmChange: noop,
		enable2faClick: noop,
		disable2faClick: noop,
		code2faChange: noop,
		pw2faChange: noop,
		enable2faSubmit: noop,
		enable2faCancel: noop,
		disable2faSubmit: noop,
		disable2faCancel: noop,

		disabledAuthProviders: [],
	};

	render() {
		return (
			<Form onSubmit={this.props.onSubmit}>
				<div className="row">
					<div className="col-xs-7">
						<TextField
							id="name"
							label={t("Name")}
							value={this.props.name}
							onChange={this.props.onNameChange}
							decoration={false}
						/>
					</div>
					<div className="col-xs-5">
						<ButtonSet>
							<ButtonSetButton
								type="submit"
								onClick={() => {}}
								id="profileEditSubmit"
								className="btn-success btn-xs"
								>
								{t("Save")}
							</ButtonSetButton>
							<ButtonSetButton
								id="profileEditCancel"
								onClick={this.props.onCancelClick}
								className="btn-default btn-xs"
								>
								{t("Cancel")}
							</ButtonSetButton>
						</ButtonSet>
					</div>
				</div>
				<hr />
				<TextField
					id="mail"
					label={t("Email") + ":"}
					value={this.props.mail}
					onChange={this.props.onMailChange}
				/>
				<h4 className="auth-title"> {t("Authentication")} </h4>
				<h5 className="pw-change-title"> {t("Password change")} </h5>
				{this.getPasswordChangeForm()}
				{this.getDisabledProvidersConnectLinks()}
				{this.get2faToggleButton()}
			</Form>
		);
	}

	getPasswordChangeForm() {
		const oldPwTextField = this.props.hasPassword ? (
			<TextField label={t("Old password")} id="oldpassword" value={this.props.oldPassword} onChange={this.props.oldPasswordChange} labelgrid={4} inputgrid={8} />
		) : null;

		return (
			<div>
				{oldPwTextField}
				<TextField label={t("New password")} id="newpassword" value={this.props.newPassword} onChange={this.props.newPasswordChange} type="password" labelgrid={4} inputgrid={8} />
				<TextField label={t("Confirm password")} id="newpasswordconfirm" value={this.props.newPasswordConfirm} onChange={this.props.newPasswordConfirmChange} type="password" labelgrid={4} inputgrid={8} />
			</div>
		);
	}

	getDisabledProvidersConnectLinks() {
		return this.props.disabledAuthProviders.map((provider) => {
			const url = `/api/auth/${provider.id}/connect?token=${csrfToken}`;
			return (
				<div key={provider.id} className="row">
					<div className="col-xs-6">
						{t("%label log in", {"%label": provider.label})}
					</div>
					<div className="col-xs-6">
						<a href={url} className="btn btn-default btn-sm profile-edit-button">{t("Connect")}</a>
					</div>
				</div>
			);
		});
	}

	get2faToggleButton() {
		if (!this.props.hasPassword) {
			return null;
		}

		if (this.props.has2fa) {
			if (this.props.disabling2fa) {
				return (
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
								onClick={this.props.disable2faCancel}
								>
								{t("Cancel")}
							</ButtonSetButton>
						</ButtonSet>
					</Form>
				);
			} else {
				return (
					<div className="row">
						<div className="col-xs-12 two-factor-auth-div">
							<a href="#" onClick={this.props.disable2faClick} className="btn btn-danger btn-sm profile-edit-button">{t("Disable 2-factor authentication")}</a>
						</div>
					</div>
				);
			}
		} else {
			if (this.props.enabling2fa) {
				return (
					<Form onSubmit={this.props.enable2faSubmit}>
						<div className="qr-code-container"><img className="qr-code" src={`/api/auth/password/add2fa?token=${csrfToken}&size=500`} /></div>
						<TextField
							label={t("Code")}
							id="2facode"
							value={this.props.code2fa}
							onChange={this.props.code2faChange}
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
								onClick={this.props.enable2faCancel}
								>
								{t("Cancel")}
							</ButtonSetButton>
						</ButtonSet>
					</Form>
				);
			} else {
				return (
					<div className="row two-factor-auth-div">
						<div className="col-xs-12">
							<a href="#" onClick={this.props.enable2faClick} className="btn btn-info btn-sm profile-edit-button">{t("Enable 2-factor authentication")}</a>
						</div>
					</div>
				);
			}
		}
	}

}

export default ProfileEdit;
