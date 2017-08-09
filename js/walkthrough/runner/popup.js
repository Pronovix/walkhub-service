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
import Runner from "walkthrough/runner";
import Modal from "components/modal";
import {noop} from "form";
import {t} from "t";

class PopupRunner extends Runner {
	popup = null;
	widget = null;
	refreshFunc = null;
	timer = null;

	openPopup = (evt) => {
		noop(evt);
		this.popup = window.open("/assets/start.html", "walkhub-highlight-"+Math.random().toString());
		this.refreshWidget();
	};

	refreshWidget() {
		if (this.refreshFunc) {
			this.refreshFunc();
		}
	}

	start() {
		this.openPopup(null);
		this.refreshWidget();
		this.timer = setInterval(() => {
			if (this.popup && this.popup.closed) {
				this.onClose();
			}
		}, 500);
	}

	end() {
		this.popup && this.popup.close();
		this.refreshWidget();
		clearInterval(this.timer);
		this.timer = null;
	}

	getWidget(title) {
		this.widget = (
			<PopupWidget
				runner={this}
				openLinkClick={this.openPopup}
				cancelClick={this.onClose}
			/>
		);

		return this.widget;
	}

	getName() {
		return "popup";
	}

}

class PopupWidget extends React.Component {

	static defaultProps = {
		runner: null,
		openLinkClick: noop,
		cancelClick: noop,
	};

	componentDidMount() {
		this.props.runner.refreshFunc = () => {
			this.forceUpdate();
		};
	}

	componentWillUnmount() {
		this.props.runner.refreshFunc = null;
	}

	render() {
		const innerWrapper = this.props.runner.popup ? (
			<div className="inner-wrapper wt-running">
				<p>{t("A walkthrough is playing or recording in a different window or tab. Do not close this window.")}</p>
				<p className="text-center">
					<a href="#" className="btn btn-default btn-lg" onClick={this.props.cancelClick}>
						{t("Abort walkthrough")}
					</a>
				</p>
			</div>
		) : (
			<div className="inner-wrapper wt-manual-open">
				<p>{t("Failed to open the popup automatically.")}</p>
				<p className="text-center">
					<a href="#" className="btn btn-default btn-lg" onClick={this.props.openLinkClick}>
						{t("Open walkthrough manually")}
					</a>
					<a href="#" className="btn btn-default btn-lg" onClick={this.props.cancelClick}>
						{t("Cancel walkthrough")}
					</a>
				</p>
			</div>
		);

		return (
			<Modal className="popup-runner-modal">
				{innerWrapper}
			</Modal>
		);
	}

}

export default PopupRunner;
