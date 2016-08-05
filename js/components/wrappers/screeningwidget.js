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

@connectToStores
class ScreeningWidgetWrapper extends React.Component {
	static defaultProps = {
		uuid: null,
		walkthrough: {},
		screening: null,
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

	state = {
		showBars: false,
		currentImage: 0,
		nextButtonEnabled: false,
		prevButtonEnabled: false,
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
			this.setState({
				currentImage: currentImage,
			});
		}
		this.fixButtons(null, Object.assign({}, this.state, {
			currentImage: currentImage,
		}));
	}

	prevClick = (evt) => {
		noop(evt);
		let currentImage = this.state.currentImage;
		if (currentImage > 0) {
			currentImage--;
			this.setState({
				currentImage: currentImage,
			});
		}
		this.fixButtons(null, Object.assign({}, this.state, {
			currentImage: currentImage,
		}));
	}

	onClick = (evt) => {
		noop(evt);
	}

	fixButtons(props = null, state = null) {
		if (!props) {
			props = this.props;
		}
		if (!state) {
			state = this.state;
		}
		const steps = props.walkthrough.steps ? props.walkthrough.steps.length : 0;
		this.setState({
			nextButtonEnabled: state.currentImage < (steps - 2),
			prevButtonEnabled: state.currentImage > 0,
		});
	}

	autoNext = () => {
		if (!this.state.showBars) {
			if (this.state.currentImage < (this.props.walkthrough.steps.length - 2)) {
				this.nextClick();
			} else {
				this.setState({
					currentImage: 0,
				});
				this.fixButtons(null, Object.assign({}, this.state, {
					currentImage: 0,
				}));
			}
		}
	}

	interval = null;

	componentDidMount() {
		this.fixButtons();
		this.maybeLoad(this.props);
		this.interval = setInterval(this.autoNext, 1000);
	}

	componentWillUnmount() {
		if (this.interval) {
			clearInterval(this.interval);
		}
	}

	componentWillReceiveProps(nextProps) {
		this.fixButtons(nextProps);
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
			<ScreeningWidget
				walkthrough={this.props.walkthrough}
				screening={this.props.screening || []}
				onMouseLeave={this.hideBars}
				onMouseEnter={this.showBars}
				prevButtonClick={this.prevClick}
				nextButtonClick={this.nextClick}
				{...this.state}
				/>
		);
	}
}

export default ScreeningWidgetWrapper;
