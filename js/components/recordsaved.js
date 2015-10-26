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
import {noop, ButtonSetButton} from "form";
import {t} from "t";

class RecordSaved extends React.Component {

	static defaultProps = {
		uuid: "",
		error: null,
		onBackClick: noop,
	}

	render() {
		return (
			<section className={(this.props.error ? "error" : "success") + " wh-record-saved"}>
				<p className="text-center">
					<span className="glyphicon glyphicon-ok" aria-hidden="true"></span>
				</p>
				<p>
					<input type="textfield" onClick={this.urlcopyFocus} onFocus={this.urlcopyFocus} ref="urlcopy" value={WALKHUB_URL + "walkthrough/" + this.props.uuid} />
				</p>
				<p className="buttons">
					<a className="btn btn-default" href={"/walkthrough/" + this.props.uuid} target="_blank">{t("Open")}</a>
					<ButtonSetButton onClick={this.props.onBackClick} className="btn-default">{t("Back")}</ButtonSetButton>
				</p>
			</section>
		);
	}

	urlcopyFocus(event) {
		event.target.select();
	}

	componentDidMount() {
		const urlcopy = React.findDOMNode(this.refs.urlcopy);
		urlcopy.focus();
		urlcopy.select();
	}

}

export default RecordSaved;
