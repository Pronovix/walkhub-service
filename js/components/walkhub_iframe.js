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
import ReactDOM from "react-dom";
import Modal from "components/modal";
import {noop} from "form";
import {t} from "t";
import flux from "control";
import WalkhubBackendActions from "actions/walkhub_backend";
import Bar from "components/bar";

class WalkhubIframe extends React.Component {

	static defaultProps = {
		src: "",
		title: "",

		actionButton: null,
		actionButtonClassName: "",
		onActionButtonClick: noop,
		recdot: false,
		errors: {},

		onClose: noop,
	};

	onChange = (event) => {
		switch (event.action) {
			case WalkhubBackendActions.SHOW_ERROR: {
					const data = event.data[0];
					this.setError(data.id, data.error);
				}
				break;
			case WalkhubBackendActions.SUPPRESS_ERROR: {
					const data = event.data[0];
					this.clearError(data.id);
				}
				break;
			case WalkhubBackendActions.CLEAR_ERRORS: {
					this.clearErrors();
				}
				break;
		}
	};

	dispatcherToken = null;

	componentDidMount() {
		this.dispatcherToken = flux.dispatcher.register(this.onChange);
		window.addEventListener("resize", this.resize);
		this.resize(null);
	}

	componentWillUnmount() {
		if (this.dispatcherToken) {
			flux.dispatcher.unregister(this.dispatcherToken);
		}
		window.removeEventListener("resize", this.resize);
	}

	state = {
		errors: {},
		height: window.innerHeight,
	};

	clearError(id) {
		let errors = this.state.errors;
		delete(errors[id]);

		this.setState({
			errors: errors,
		});
	}

	clearErrors() {
		this.setState({errors: {}});
	}

	setError(id, error) {
		let errors = this.state.errors;
		errors[id] = error;

		this.setState({
			errors: errors,
		});
	}

	resize = (evt) => {
		const iframe = ReactDOM.findDOMNode(this.refs.contentIframe);
		const top = iframe.getBoundingClientRect().top;
		this.setState({
			height: window.innerHeight - top,
		});
	}

	render() {
		const errors = this.state.errors;
		const errs = Object.keys(errors).map(function(errid) {
			return (
				<li key={errid}>
					<span className="alert-danger" dangerouslySetInnerHTML={{__html: errors[errid]}} />
				</li>
			);
		});

		return (
			<Modal>
				<Bar
					actionButton={this.props.actionButton}
					actionButtonClassName={this.props.actionButtonClassName}
					onActionButtonClick={this.props.onActionButtonClick}
					brand={this.props.title}
					onClose={this.props.onClose}
					>
					{errs}
				</Bar>
				<div className="container-fluid iframe-container">
					<div className="row">
						<iframe ref="contentIframe" style={{height: `${this.state.height}px`}} className="col-xs-12" src={this.props.src} frameBorder="0" scrolling="auto" allowTransparency="true"></iframe>
					</div>
				</div>
			</Modal>
		);
	}

}

export default WalkhubIframe;
