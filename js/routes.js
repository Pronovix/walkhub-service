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
import {Route} from "react-router";

import AppWrapper from "components/wrappers/app";
import RecordWrapper from "components/wrappers/record";
import WalkthroughWrapper from "components/wrappers/walkthrough";
import FrontpageComponent from "FRONT_PAGE";
import ConnectWrapper from "components/wrappers/connect";
import SearchWrapper from "components/wrappers/search";
import EmbedCodeBuilderWrapper from "components/wrappers/embedcodebuilder";
import HelpCenterListWrapper  from "components/wrappers/helpcenterlist";
import ProfileWrapper from "components/wrappers/profile";
import OuterClassActions from "actions/outerclass";

let contentPagesConfig = {};

if (WALKHUB_CONTENT_PAGES) {
	contentPagesConfig = require("CONTENT_PAGES");
}

function onEnter(nextState, replaceState) {
	const matches = this.path.match(/^\/?([a-z0.9]*)/);
	const path = (matches.length > 1) ? (matches[1] || "front") : null;
	setTimeout(() => {
		OuterClassActions.changeOuterClasses({path: path});
	}, 0);
}

const contentPages = Object.keys(contentPagesConfig).map(function(path) {
	return <Route key={path} path={path} component={contentPagesConfig[path]} onEnter={onEnter} />;
});

const Routes = (
	<Route component={AppWrapper}>
		<Route path="/" component={FrontpageComponent} onEnter={onEnter} />
		<Route path="/connect" component={ConnectWrapper} onEnter={onEnter} />
		<Route path="/record" component={RecordWrapper} onEnter={onEnter} />
		<Route path="/walkthrough/:uuid" component={WalkthroughWrapper} onEnter={onEnter} />
		<Route path="/search" component={SearchWrapper} onEnter={onEnter} />
		<Route path="/embedcode" component={EmbedCodeBuilderWrapper} onEnter={onEnter} />
		<Route path="/helpcenterlist" component={HelpCenterListWrapper} onEnter={onEnter} />
		<Route path="/profile/:UUID" component={ProfileWrapper} onEnter={onEnter} />
		{contentPages}
	</Route>
);

export default Routes;
