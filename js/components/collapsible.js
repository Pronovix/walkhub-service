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
import ReactCSSTransitionGroup from 'react-addons-css-transition-group';

class Collapsible extends React.Component {
  constructor(props) {
    super(props);
    this.state = {isExpanded: this.props.isExpanded};
    this.clickTitle = this.clickTitle.bind(this);
  }
  clickTitle() {
    this.setState({isExpanded: !this.state.isExpanded});
  }

  render() {
    return (
      <div className={"collapsible-container " + (this.state.isExpanded ? "expanded" : "collapsed")}>
        <div className="row">
          <div className="col-xs-12">
            <a className="title" onClick={this.clickTitle}>
              {this.props.title}
            </a>
            <div className="content" key={this.state.isExpanded}>
              {this.state.isExpanded ? this.props.children : ""}
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default Collapsible;