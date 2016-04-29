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
import {t} from "t";

class OnOff extends React.Component {
	
	static defaultProps = {
		value: false,
		on: t("On"),
		off: t("Off"),
	};

	render() {
		const children = this.props.value ? this.props.on : this.props.off;
		const className = this.props.value ? "text-success" : "text-danger";

		return (
			<span className={className}> {children} </span>
		);
	}
}

export default OnOff;
