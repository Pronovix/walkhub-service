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
import {csrfToken} from "util";
import {t} from "t";
import {noop, TextField, Button, ButtonSet, ButtonSetButton, Form} from "form";

import logo from "images/walkhub-official-logo.jpg"

class Connect extends React.Component {

	static defaultProps = {
		providers: [],
		password: true,

		signin: false,
		signin2fa: false,
		signinMail: "",
		signinPassword: "",
		signin2faToken: "",
		signupMail: "",
		signupPassword: "",
		signupPasswordConfirm: "",
		lostPassword: false,
		lostPasswordMail: "",

		signinMailChange: noop,
		signinPasswordChange: noop,
		signinTokenChange: noop,
		signupMailChange: noop,
		signupPasswordChange: noop,
		signupPasswordConfirmChange: noop,
		signinClick: noop,
		signinSubmit: noop,
		signin2faSubmit: noop,
		signupSubmit: noop,
		lostPasswordClick: noop,
		lostPasswordSubmit: noop,
	};

	render() {
		const providers = this.props.providers.map((provider) => {
			const url = `/api/auth/${provider.id}/connect?token=${csrfToken}`;
			return (
				<div key={provider.id} className={"col-xs-12 col-md-4 col-md-offset-4 provider-"+provider.id}>
					<a href={url} className="btn btn-primary btn-block">{t("Log in with @label", {"@label": provider.label})}</a>
				</div>
			);
		});

		const signinButton = (this.props.password && !this.props.signin) ? (
			<a className="btn btn-default" onClick={this.props.signinClick}>{t("Sign in")}</a>
		) : null;

		let signinForm = null;

		const lostPasswordButton = this.props.lostPassword ? null : (
				<ButtonSetButton
					onClick={this.props.lostPasswordClick}
					className="btn-default"
					id="signinLostPassword"
					>
						{t("Lost password")}
				</ButtonSetButton>
		);

		if (this.props.password && this.props.signin) {
			if (this.props.signin2fa) {
				signinForm = (
					<Form onSubmit={this.props.signin2faSubmit}>
						<TextField
							id="token"
							label={t("Token")}
							value={this.props.signin2faToken}
							onChange={this.props.signinTokenChange}
							placeholder="123456"
							attributes={{autoComplete: "off"}}
						/>
						<ButtonSet>
							<ButtonSetButton
								type="submit"
								className="btn-success"
								onClick={() => {}}
								>
								{t("Continue")}
							</ButtonSetButton>
						</ButtonSet>
					</Form>
				);
			} else {
				signinForm = (
					<form onSubmit={this.props.signinSubmit} name="signin-form" className="text-left">
						<TextField
							id="identifier"
							type="email"
							label={t("email")}
							value={this.props.signinMail}
							onChange={this.props.signinMailChange}
							placeholder="mail@example.com"
						/>
						<TextField
							id="password"
							value={this.props.signinPassword}
							onChange={this.props.signinPasswordChange}
							type="password"
							label={t("password")}
							placeholder="********"
						/>
						<ButtonSet>
							<ButtonSetButton
								type="submit"
								className="btn-default"
								onClick={() => {}}
								id="signinSubmit"
								>
									{t("Sign in")}
							</ButtonSetButton>
							{lostPasswordButton}
						</ButtonSet>
					</form>
				);
			}
		}

		const lostPasswordForm = this.props.lostPassword ? (
			<form onSubmit={this.props.lostPasswordSubmit} name="lostpassword-form">
				<TextField
					id="email"
					type="email"
					label={t("email")}
					value={this.props.lostPasswordMail}
					onChange={this.props.lostPasswordMailChange}
					placeholder="mail@example.com"
				/>
				<Button
					type="submit"
					className="btn-default"
					onClick={() => {}}
					id="lostpasswordSubmit"
					>
						{t("Request a one-time login link")}
				</Button>
			</form>
		) : null;

		const signinWrapper = this.props.password ? (
			<div className="row">
				<div className="col-xs-12 col-md-5 col-md-offset-7 text-right connect-signin">
					{signinButton}
					{signinForm}
					{lostPasswordForm}
				</div>
			</div>
		) : null;

		const signupForm = (this.props.password) ? (
			<form onSubmit={this.props.signupSubmit} name="signup-form">
				<TextField
					id="mail"
					type="email"
					label={t("email")}
					value={this.props.signupMail}
					onChange={this.props.signupMailChange}
					placeholder="mail@example.com"
				/>
				<TextField
					id="password"
					type="password"
					label={t("password")}
					value={this.props.signupPassword}
					onChange={this.props.signupPasswordChange}
					placeholder="********"
				/>
				<TextField
					id="password_confirm"
					type="password"
					label={t("password confirm")}
					value={this.props.signupPasswordConfirm}
					onChange={this.props.signupPasswordConfirmChange}
					placeholder="********"
				/>
				<Button
					type="submit"
					className="btn-success"
					onClick={() => {}}
					id="signupSubmit"
					>
						{t("Sign up for free")}
				</Button>
			</form>
		) : null;

		const signupWrapper = this.props.password ? (
			<div className="row">
				<div className="col-xs-12 col-md-6 col-md-offset-3 connect-signup">
					{signupForm}
				</div>
			</div>
		): null;

		return (
			<section className="wh-connect">
				{signinWrapper}
				<div className="row">
					<div className="col-xs-12 text-center">
						<p><img src={logo} width="300" height="300" /></p>
						<h4>{t("Record walkthroughs and play them on top of websites")}</h4>
						<hr />
					</div>
				</div>
				<div className="row">
					{providers}
				</div>
				<hr />
				{signupWrapper}
			</section>
		);
	}

}

export default Connect;
