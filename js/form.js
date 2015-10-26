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

class ImmutableFormItem extends React.Component {

	shouldComponentUpdate(nextProps, nextState) {
		return nextProps.value !== this.props.value;
	}

}

export function noop(e) {
	if (e && e.preventDefault) {
		e.preventDefault();
	}
}

export class Form extends React.Component {

	render() {
		return <form className="form-horizontal">{this.props.children}</form>;
	}

}

export class TextField extends ImmutableFormItem {

	static defaultProps = {
		id: "",
		label: "",
		value: "",
		onChange: noop,
	};

	render() {
		return (
			<div className={"form-group " + this.props.id}>
				<label className="col-sm-2 control-label" htmlFor={this.props.id}>{this.props.label}</label>
				<div className="col-sm-10">
					<input type="text" className="form-control" id={this.props.id} name={this.props.name || this.props.id} value={this.props.value} onChange={this.props.onChange} />
				</div>
			</div>
		);
	}

}

export class TextArea extends ImmutableFormItem {

	static defaultProps = {
		id: "",
		label: "",
		value: "",
		onChange: noop,
	};

	render() {
		return (
			<div className="form-group">
				<label className="col-sm-2 control-label" htmlFor={this.props.id}>{this.props.label}</label>
				<div className="col-sm-10">
					<textarea className="form-control" id={this.props.id} name={this.props.name || this.props.id} value={this.props.value} onChange={this.props.onChange} />
				</div>
			</div>
		);
	}

}

export class Radios extends React.Component {

	static defaultProps = {
		options: [],
		name: "",
		onChange: noop,
		checked: null,
	};

	shouldComponentUpdate(nextProps, nextState) {
		return nextProps.checked !== this.props.checked;
	}

	render() {
		const options = this.props.options ? Object.keys(this.props.options).map((key) => {
			return (
				<div className="radio" key={key}>
					<label>
						<input type="radio" name={this.props.name} value={key} checked={key === this.props.checked ? "checked" : ""} onChange={this.props.onChange} />
						{this.props.options[key]}
					</label>
				</div>
			);
		}) : [];

		return (
			<div className={"form-group " + this.props.name}>
				<div className="col-sm-offset-2 col-sm-10">
					{options}
				</div>
			</div>
		);
	}

}

export class CheckBox extends React.Component {

	static defaultProps = {
		name: "",
		id: "",
		label: "",
		checked: false,
		onChange: noop,
	};

	shouldComponentUpdate(nextProps, nextState) {
		return nextProps.checked !== this.props.checked;
	}

	render() {
		return (
			<div className={"form-group " + this.props.name}>
				<div className="col-sm-offset-2 col-sm-10">
					<label>
						<input type="checkbox" name={this.props.name || this.props.id} checked={this.props.checked} id={this.props.id} onChange={this.props.onChange} />
						{this.props.label}
					</label>
				</div>
			</div>
		);
	}

}

export class ButtonSet extends React.Component {

	static defaultProps = {
		className: "",
		grid: true,
	};

	render() {
		return (
			<div className={(this.props.grid ? "form-group " : "") + this.props.className}>
				<div className={this.props.grid ? "col-sm-offset-2 col-sm-10" : ""}>
					{this.props.children}
				</div>
			</div>
		);
	}

}

export class ButtonSetButton extends React.Component {

	static defaultProps = {
		type: "button",
		onClick: noop,
		className: "",
		id: "",
		name: "",
	};

	render() {
		return (
			<button onClick={this.props.onClick} type={this.props.type} className={"btn " + this.props.className} id={this.props.id} name={this.props.name || this.props.id}>{this.props.children}</button>
		);
	}

}

export class Button extends React.Component {

	static defaultProps = {
		type: "button",
		onClick: noop,
		className: "",
		containerClassName: "",
		id: "",
		name: "",
		grid: true,
	};

	render() {
		return (
			<ButtonSet grid={this.props.grid} className={this.props.containerClassName}>
				<ButtonSetButton onClick={this.props.onClick} type={this.props.type} className={this.props.className} id={this.props.id} name={this.props.name || this.props.id}>{this.props.children}</ButtonSetButton>
			</ButtonSet>
		);
	}

}
