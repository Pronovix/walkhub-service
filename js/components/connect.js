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

class Connect extends React.Component {

	static defaultProps = {
		providers: []
	};

	render() {
		const providers = this.props.providers.map((provider) => {
			const url = `/api/auth/${provider.id}/connect?token=${csrfToken}`;
			return (
				<div key={provider.id} className={"col-xs-4 col-md-offset-4 provider-"+provider.id}>
					<a href={url} className="btn btn-primary btn-block">{t("Log in with @label", {"@label": provider.label})}</a>
				</div>
			);
		});
		return (
			<section className="wh-connect">
				<div className="row">
					<div className="col-xs-12 text-center">
						<p><img src="/assets/images/walkhub-official-logo.jpg" width="300" height="300" /></p>
						<h4>{t("Record walkthroughs and play them on top of websites")}</h4>
						<hr />
					</div>
				</div>
				<div className="row">
					{providers}
				</div>
			</section>
		);
	}

}

export default Connect;
