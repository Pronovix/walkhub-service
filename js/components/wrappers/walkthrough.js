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
import WalkthroughPlay from "components/wrappers/walkthroughplay";
import WalkthroughEdit from "components/walkthroughedit";
import WalkthroughStore from "stores/walkthrough";
import WalkthroughActions from "actions/walkthrough";
import UserStore from "stores/user";
import UserActions from "actions/user";
import connectToStores from "alt/utils/connectToStores";
import {noop} from "form";
import flux from "control";
import WalkhubBackend from "walkhub_backend";
import LogStore from "stores/log";

@connectToStores
class WalkthroughWrapper extends React.Component {

	static defaultProps = {
		params: {
			uuid: null,
		},
		walkthrough: {},
		user: {},
	};

	static getStores(props) {
		return [WalkthroughStore, UserStore];
	}

	static contextTypes = {
		location: React.PropTypes.shape,
		history: React.PropTypes.shape,
	};

	dispatcherToken = null;
	state = {
		editing: false,
		editdata: null,
	};

	static getPropsFromStores(props) {
		const walkthroughStoreState = WalkthroughStore.getState();
		const userStoreState = UserStore.getState();

		return {
			walkthrough: walkthroughStoreState.walkthroughs[props.params.uuid],
			user: userStoreState.users[userStoreState.currentUser] || {},
		};
	}

	render() {
		if (!this.props.params.uuid) {
			return null;
		}

		if (this.state.editing) {
			return (
				<WalkthroughEdit
					walkthrough={this.props.walkthrough}
					onCancelClick={this.cancelEditWalktrough}
					onSaveClick={this.saveWalkthrough}

					onNameChange={this.nameChange}
					onSeverityChange={this.severityChange}
					onDescriptionChange={this.descriptionChange}

					onStepTitleChange={this.stepTitleChange}
					onStepDescriptionChange={this.stepDescriptionChange}
					onStepHighlightChange={this.stepHighlightChange}
					onStepCommandChange={this.stepCommandChange}
					onStepArg0Change={this.stepArg0Change}
					onStepArg1Change={this.stepArg1Change}
				/>
			);
		} else {
			const editable = this.props.user && this.props.walkthrough && (this.props.user.Admin || this.props.user.UUID === this.props.walkthrough.uid);
			return (
				<WalkthroughPlay
					embedded={!!this.context.location.query.embedded}
					walkthrough={this.props.walkthrough}
					editable={editable}
					onEditClick={this.editWalkthrough}
					onDeleteClick={this.deleteWalkthrough}
				/>
			);
		}
	}

	editWalkthrough = (evt) => {
		noop(evt);
		this.setState({
			editing: true,
			editdata: this.props.walkthrough,
		});
	};

	deleteWalkthrough = (evt) => {
		noop(evt);
		WalkthroughStore.performDelete(this.props.params.uuid);
	};

	cancelEditWalktrough = (evt) => {
		noop(evt);
		this.setState({
			editing: false,
			editdata: null,
		});
	};

	saveWalkthrough = (evt) => {
		noop(evt);
		WalkthroughStore.performPut(this.state.editdata);
	};

	nameChange = (evt) => {
		this.changeWalkthroughAttribute("name", evt);
	};

	severityChange = (evt) => {
		this.changeWalkthroughAttribute("severity", evt);
	};

	descriptionChange = (evt) => {
		this.changeWalkthroughAttribute("description", evt);
	};

	changeWalkthroughAttribute(attr, evt) {
		let w = this.state.editdata;
		w[attr] = evt.target.value;
		this.setState({
			editdata: w,
		});
	}

	stepTitleChange = (evt, item) => {
		this.changeWalkthroughStepAttribute("title", item, evt);
	};

	stepDescriptionChange = (evt, item) => {
		this.changeWalkthroughStepAttribute("description", item, evt);
	};

	stepHighlightChange = (evt, item) => {
		this.changeWalkthroughStepAttribute("highlight", item, evt);
	};

	stepCommandChange = (evt, item) => {
		this.changeWalkthroughStepAttribute("cmd", item, evt);
	};

	stepArg0Change = (evt, item) => {
		this.changeWalkthroughStepAttribute("arg0", item, evt);
	};

	stepArg1Change = (evt, item) => {
		this.changeWalkthroughStepAttribute("arg1", item, evt);
	};

	changeWalkthroughStepAttribute(attr, item, evt, property) {
		if (!property) {
			property = "value";
		}
		let w = this.state.editdata;
		w.steps[item][attr] = evt.target[property];
		this.setState({
			editdata: w,
		});
	}

	walkthroughSaved = (evt) => {
		switch (evt.action) {
			case WalkthroughActions.UPDATED_WALKTHROUGH:
				this.cancelEditWalktrough(null);
				break;
			case WalkthroughActions.DELETED_WALKTHROUGH:
				this.context.history.pushState(null, "/");
				break;
		}
	};

	componentDidMount() {
		setTimeout(() => {
			WalkthroughStore.performLoad(this.props.params.uuid);
			LogStore.performWalkthroughPageVisited(this.props.params.uuid, this.context.location.query.embedorigin);
		}, 0);

		this.dispatcherToken = flux.dispatcher.register(this.walkthroughSaved);
	}

	componentWillUnmount() {
		if (this.dispatcherToken) {
			flux.dispatcher.unregister(this.dispatcherToken);
		}
	}

}

export default WalkthroughWrapper;
