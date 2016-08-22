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
import connectToStores from "alt/utils/connectToStores";
import WalkthroughStore from "stores/walkthrough";
import ScreeningWidget from "components/screeningwidget";
import {noop} from "form";
import {t} from "t";

@connectToStores
class ScreeningWidgetWrapper extends React.Component {
	static defaultProps = {
		uuid: null,
		walkthrough: {},
		screening: null,
		className: "",
	};

	static getStores(props) {
		return [WalkthroughStore];
	}

	static getPropsFromStores(props) {
		const state = WalkthroughStore.getState();
		if (!props.uuid) {
			return {};
		}

		return {
			walkthrough: state.walkthroughs[props.uuid],
			screening: state.screenings[props.uuid] && state.screenings[props.uuid]["application/json"],
		};
	}

	static contextTypes = {
		location: React.PropTypes.shape,
		history: React.PropTypes.shape,
	};

	state = {
		showBars: false,
		currentImage: 0,
		nextButtonEnabled: true,
		prevButtonEnabled: true,
	};

	showBars = () => {
		this.setState({
			showBars: true,
		});
	}

	hideBars = () => {
		this.setState({
			showBars: false,
		});
	}

	nextClick = (evt) => {
		noop(evt);
		let currentImage = this.state.currentImage;
		if (this.state.currentImage < (this.props.walkthrough.steps.length - 2)) {
			currentImage++;
		} else {
			currentImage = 0;
		}
		this.setState({
			currentImage: currentImage,
		});
	}

	prevClick = (evt) => {
		noop(evt);
		let currentImage = this.state.currentImage;
		if (currentImage > 0) {
			currentImage--;
		} else {
			currentImage = this.props.walkthrough.steps.length - 2;
		}
		this.setState({
			currentImage: currentImage,
		});
	}

	onClick = (evt) => {
		noop(evt);
		this.nextClick();
	}

	autoNext = () => {
		if (!this.state.showBars) {
			this.nextClick();
		}
	}

	shareClick = (evt) => {
		noop(evt);
	}

	fullscreenClick = (evt) => {
		noop(evt);
		if (document.fullscreenElement || document.webkitFullscreenElement) {
			if (document.exitFullscreen) {
				document.exitFullscreen();
			} else if (document.webkitExitFullscreen) {
				document.webkitExitFullscreen();
			}
		} else {
			const elem = this.refs.screeningwrapper;
			if (elem.requestFullscreen) {
				elem.requestFullscreen();
			} else if (elem.webkitRequestFullscreen) {
				elem.webkitRequestFullscreen();
			}
		}
	}

	interval = null;

	componentDidMount() {
		this.maybeLoad(this.props);
		const autoadvance = this.context.location && this.context.location.query && this.context.location.query.autoadvance ?
			this.context.location.query.autoadvance :
			2000;
		this.interval = setInterval(this.autoNext, autoadvance);
	}

	componentWillUnmount() {
		if (this.interval) {
			clearInterval(this.interval);
		}
	}

	componentWillReceiveProps(nextProps) {
		this.maybeLoad(nextProps);
	}

	maybeLoad(props) {
		const uuid = props.uuid;
		if (uuid) {
			if (!this.props.walkthrough.uuid) {
				setTimeout(() => {
					WalkthroughStore.performLoad(uuid);
				}, 0);
			}
			if (!this.props.screening) {
				setTimeout(() => {
					WalkthroughStore.performLoadScreening(uuid, "application/json");
				}, 0);
			}
		}
	}

	render() {
		return (
			<div ref="screeningwrapper" className={"screeningwidget-wrapper container-fluid "+this.props.className}>
				<ScreeningWidget
					walkthrough={this.props.walkthrough}
					screening={this.props.screening || []}
					onMouseLeave={this.hideBars}
					onMouseEnter={this.showBars}
					onClick={this.onClick}
					prevButtonClick={this.prevClick}
					nextButtonClick={this.nextClick}
					shareClick={this.shareClick}
					fullscreenClick={this.fullscreenClick}
					{...this.state}
					/>
			</div>
		);
	}
}

export default ScreeningWidgetWrapper;
