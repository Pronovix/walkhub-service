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
import Connect from "components/connect";
import AuthProviderStore from "stores/auth_provider";
import AuthProviderActions from "actions/auth_provider";
import connectToStores from "alt/utils/connectToStores";

@connectToStores
class ConnectWrapper extends React.Component {

	static getStores(props) {
		return [AuthProviderStore];
	}

	static getPropsFromStores(props) {
		return AuthProviderStore.getState();
	}

	componentDidMount() {
		AuthProviderStore.performLoad();
	}

	render() {
		return <Connect providers={this.props.providers} />;
	}

}

export default ConnectWrapper;
