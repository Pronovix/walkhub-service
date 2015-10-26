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
import {Route, DefaultRoute} from "react-router";

import AppWrapper from "components/wrappers/app";
import User from "components/user";
import RecordWrapper from "components/wrappers/record";
import WalkthroughWrapper from "components/wrappers/walkthrough";
import FrontpageWrapper from "components/wrappers/frontpage";
import ConnectWrapper from "components/wrappers/connect";
import SearchWrapper from "components/wrappers/search";
import EmbedCodeBuilderWrapper from "components/wrappers/embedcodebuilder";

const Routes = (
	<Route handler={AppWrapper}>
		<DefaultRoute name="frontpage" handler={FrontpageWrapper} />
		<Route name="connect" path="/connect" handler={ConnectWrapper} />
		<Route name="user" path="/user/:UUID" handler={User} />
		<Route name="record" path="/record" handler={RecordWrapper} />
		<Route name="walkthrough" path="/walkthrough/:uuid" handler={WalkthroughWrapper} />
		<Route name="search" path="/search" handler={SearchWrapper} />
		<Route name="embedcode" path="/embedcode" handler={EmbedCodeBuilderWrapper} />
	</Route>
);

export default Routes;
