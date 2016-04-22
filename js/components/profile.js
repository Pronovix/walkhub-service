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
import {csrfToken} from "util";
import {t} from "t";

class Profile extends React.Component {

	static defaultProps = {
		user: {},
		authProviders: {},
		has2fa: false,
		userAuthProviders: {},
	};

	render() {
		const uuid = this.props.user.UUID;
		const userProviders = this.props.userAuthProviders[uuid] || [];

		const hasPassword = userProviders.indexOf("password") !== -1;

		const enabledProviders = this.props.authProviders.providers.filter((provider) => {
			return userProviders.indexOf(provider.id) !== -1;
		}).map((provider) => {
			return provider.label;
		}).join(", ");

		const disabledProviders = this.props.authProviders.providers.filter((provider) => {
			return userProviders.indexOf(provider.id) === -1 && provider.id !== "password";
		}).map((provider) => {
			const url = `/api/auth/${provider.id}/connect?token=${csrfToken}`;
			return (
				<a href={url} key={provider.id} className="btn btn-primary btn-block">{t("Log in with @label", {"@label": provider.label})}</a>
			);
		});

		const addProviderWrapper = disabledProviders ? (
			<div className="row">
				<div className="col-xs-4">{t("Add new authentication provider")}</div>
				<div className="col-xs-8">{disabledProviders}</div>
			</div>
		) : null;

		return (
			<section className="profile">
				<div className="row">
					<div className="col-xs-12">
						<div className="row">
							<div className="col-xs-4">{t("Name")}</div>
							<div className="col-xs-8">{this.props.user.Name}</div>
						</div>
						<div className="row">
							<div className="col-xs-4">{t("Mail")}</div>
							<div className="col-xs-8">{this.props.user.Mail}</div>
						</div>
						<div className="row">
							<div className="col-xs-4">{t("Authentication providers")}</div>
							<div className="col-xs-8">{enabledProviders}</div>
						</div>
						{addProviderWrapper}
					</div>
				</div>
				{this.props.children}
			</section>
		);
	}

}

export default Profile;
