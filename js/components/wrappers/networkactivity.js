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
import NetworkActivity from "components/networkactivity";
import flux from "control";
import NetworkActivityActions from "actions/networkactivity";
import Modal from "components/modal";

const DELAY = 500; // delay in ms

class NetworkActivityWrapper extends React.Component {

	state = {
		requests: 0,
		displayIndicator: false,
	};

	dispatcherToken = null;

	componentDidMount() {
		this.dispatcherToken = flux.dispatcher.register(this.onChange);
	}

	componentWillUnmount() {
		if (this.dispatcherToken) {
			flux.dispatcher.unregister(this.dispatcherToken);
		}
	}

	onChange = (event) => {
		switch(event.action) {
			case NetworkActivityActions.ACTIVITY_STARTED:
				this.setState({
					requests: this.state.requests + 1,
				});
				this.maybeDisplayIndicator();
				break;
			case NetworkActivityActions.ACTIVITY_ENDED:
				this.setState({
					requests: Math.max(this.state.requests - 1, 0),
				});
				this.maybeHideIndicator();
				break;
		}
	};

	maybeDisplayIndicator() {
		if (this.state.displayIndicator) {
			return;
		}

		setTimeout(() => {
			if (this.state.request > 0) {
				this.setState({
					displayIndicator: true,
				});
			}
		}, DELAY);
	}

	maybeHideIndicator() {
		if (!this.state.displayIndicator || this.state.requests > 0) {
			return;
		}

		setTimeout(() => {
			if (this.state.request == 0) {
				this.setState({
					displayIndicator: false,
				});
			}
		}, DELAY);
	}

	render() {
		return this.state.displayIndicator ? (
			<Modal className="seethrough">
				<NetworkActivity />
			</Modal>
		) : <div />;
	}

}

export default NetworkActivityWrapper;
