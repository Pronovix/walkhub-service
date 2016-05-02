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
import OnOff from "components/onoff";
import {noop} from "form";

class Profile extends React.Component {

	static defaultProps = {
		user: {},
		authProviders: {},
		has2fa: false,
		userAuthProviders: {},
		list: null,
		canEdit: false,
		onEditClick: noop,
	};

	render() {
		const uuid = this.props.user.UUID;
		const userProviders = this.props.userAuthProviders[uuid] || [];

		const hasPassword = userProviders.indexOf("password") !== -1;

		const providerStatus = this.props.authProviders.providers.map((provider) => {
			const val = userProviders.indexOf(provider.id) !== -1;
			return (
				<p key={provider.id} className={`profile-auth-provider profile-auth-provider-${provider.id}`}>
					{provider.label}: <OnOff value={val} />
				</p>
			);
		});

		const tfastatus = (
			<p className="profile-auth-provider profile-auth-provider-2fa">
				{t("Two-factor authentication")}: <OnOff value={this.props.has2fa} />
			</p>
		);

		const editButton = this.props.canEdit ? (
			<a href="#" className="btn btn-default" onClick={this.props.onEditClick}>{t("Edit")}</a>
		) : null;

		return (
			<div className="row">
				<div className="col-xs-12">
					<div className="row user-data-header">
						<div className="col-xs-9"><h3 className="user-name">{this.props.user.Name}</h3></div>
						<div className="col-xs-3">
							{editButton}
						</div>
					</div>
					<div className="row">
						<div className="col-xs-12"><strong className="profile-mail">{t("Email")}:</strong> {this.props.user.Mail}</div>
					</div>
					<div className="spacer">&nbsp;</div>
					<div className="row">
						<div className="col-xs-12">
							<p><strong className="profile-auth">{t("Authentication")}</strong></p>
							{providerStatus}
							{tfastatus}
						</div>
					</div>
				</div>
			</div>
		);
	}

}

export default Profile;
