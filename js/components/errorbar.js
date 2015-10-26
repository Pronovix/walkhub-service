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
import {noop} from "form";
import {t} from "t";

class ErrorBar extends React.Component {

	static defaultProps = {
		messages: [],
		onMessageClose: noop,
	};

	render() {
		const msgClose = this.props.onMessageClose;
		const messages = this.props.messages.map(function(message) {
			return (
				<div key={message.key} className={"alert alert-"+message.type} role="alert">
					<button data-key={message.key} onClick={msgClose} type="button" className="close" aria-label={t("Close")}>
						<span data-key={message.key} aria-hidden="true">
							&times;
						</span>
					</button>
					{message.message}
				</div>
			);
		});

		return (
			<div>
				{messages}
			</div>
		);
	}

}

export default ErrorBar;
