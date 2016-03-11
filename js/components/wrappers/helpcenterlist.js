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
import escapeStringRegexp from "escape-string-regexp";
import RemoteStore from "stores/remote";
import WalkthroughStore from "stores/walkthrough";
import connectToStores from "alt/utils/connectToStores";
import HelpCenterList from "components/helpcenterlist";
import WalkhubBackend from "walkhub_backend";
import HelpButton from "components/helpbutton";
import Bar from "components/bar";
import {noop} from "form";
import {t} from "t";

@connectToStores
class HelpCenterListWrapper extends React.Component {

	static getStores(props) {
		return [RemoteStore, WalkthroughStore];
	}

	static contextTypes = {
		location: React.PropTypes.shape,
	};

	static getPropsFromStores(props) {
		const remoteStoreState = RemoteStore.getState().cache;
		const walkthroughs = WalkthroughStore.getState().walkthroughs;

		return {
			remotes: remoteStoreState,
			walkthroughs: walkthroughs,
		};
	}

	static defaultProps = {
		remotes: {},
		walkthroughs: {},
	};

	constructor(props) {
		super(props);
		this.walkthroughRegexp = new RegExp("^" +
			escapeStringRegexp(WALKHUB_URL + "walkthrough/") +
			"([\\da-f]{8}-[\\da-f]{4}-[\\da-f]{4}-[\\da-f]{4}-[\\da-f]{12})$"
		);
		this.youtubeRegexp = /((http(s)?:\/\/)?)(www\.)?((youtube\.com\/)|(youtu.be\/))[\S]+/;
		this.youtubeID = /^.*(?:(?:youtu\.be\/|v\/|vi\/|u\/\w\/|embed\/)|(?:(?:watch)?\?v(?:i)?=|\&v(?:i)?=))([^#\&\?]*).*/;
		this.loadTriggered = {};
		this.state = {
			iframeLink: "",
			iframeTitle: "",
			helpButton: false,
		};
	}

	render() {
		if (this.state.helpButton) {
			return <HelpButton helpClick={this.onHelpClick} />;
		}

		const remotes = this.getRemotes();
		let items = [];
		(remotes || []).map((item) => {
			if (item.group) {
				items.push({
					group: item.group,
					type: "group",
				});
			} else if (this.walkthroughRegexp.test(item.link)) {
				const uuid = this.walkthroughRegexp.exec(item.link)[1];
				items.push({
					link: item.link,
					type: "walkthrough",
					uuid: uuid,
				});
			} else if (this.youtubeRegexp.test(item.link)) {
				const id = this.youtubeID.exec(item.link)[1];
				items.push({
					link: `https://www.youtube.com/embed/${id}`,
					title: item.title,
					description: item.description,
					type: "youtube",
					id: id,
				});
			} else {
				items.push({
					link: item.link,
					title: item.title,
					description: item.description,
					type: "iframe",
				});
			}
		});

		const bar = this.isEmbedded() ? (
			<Bar
				brand={t("Get help")}
				onClose={this.onBarCloseClick}
				helpcenter={true}
			/>
		) : null;

		const footer = this.isEmbedded() ? (
			<Bar
				footer={true}
			/>
		) : null;

		return (
			<div>
				{bar}
				<HelpCenterList
					items={items}
					walkthroughs={this.props.walkthroughs}
					iframeLink={this.state.iframeLink}
					iframeTitle={this.state.iframeTitle}
					linkClick={this.linkClick}
					onClose={this.onClose}
				/>
				{footer}
			</div>
		);
	}

	isEmbedded() {
		return !!this.context.location.query.embedded;
	}

	onHelpClick = (evt) => {
		this.setState({
			helpButton: false,
		});
		WalkhubBackend.embedSetListState();
	}

	onBarCloseClick = (evt) => {
		this.setState({
			helpButton: true,
		});
		WalkhubBackend.embedResetState();
	}

	linkClick = (e, item) => {
		noop(e);
		this.setState({
			iframeLink: item.link,
			iframeTitle: item.title,
		});
		WalkhubBackend.embeddedPost({type: "start"});
	}

	onClose = () => {
		this.setState({
			iframeLink: "",
			iframeTitle: "",
		});
		WalkhubBackend.embeddedPost({type: "end"});
	}

	componentWillReceiveProps(nextProps) {
		const url = this.getURL();
		if (nextProps.remotes[url]) {
			nextProps.remotes[url].map((item) => {
				if (this.walkthroughRegexp.test(item.link)) {
					const uuid = this.walkthroughRegexp.exec(item.link)[1];
					if (!nextProps.walkthroughs[uuid] && !this.loadTriggered[uuid]) {
						this.loadTriggered[uuid] = true;
						setTimeout(() => {
							WalkthroughStore.performLoad(uuid);
						}, 0);
					}
				}
			});
		}
	}

	componentDidMount() {
		const url = this.getURL();
		RemoteStore.performLoad(url);
	}

	componentWillMount() {
		this.setState({
			helpButton: this.isEmbedded(),
		});
	}

	getURL() {
		return this.context.location.query.url;
	}

	getRemotes() {
		const url = this.getURL();
		return this.props.remotes && this.props.remotes[url];
	}
}

export default HelpCenterListWrapper;
