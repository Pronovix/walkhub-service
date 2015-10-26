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


class ProxyServer {

	constructor(frame, defaultOrigin) {
		var that = this;

		this.tickets = {};
		this.frame = frame;
		this.origin = defaultOrigin;
		this.serverKey = null;
		this.paused = false;

		window.addEventListener("message", function (event) {
			if (that.paused) {
				return;
			}
			var data = JSON.parse(event.data);
			if (data && data.type && data.type === "ping") {
				that.log(["Ping received, sending pong", event.origin]);
				event.source.postMessage(JSON.stringify({type: "pong", tag: "proxy"}), event.origin);
				return;
			}
			if (that.serverKey) {
				if (frame === event.source) {
					if (data.proxy_key && that.tickets[data.proxy_key]) {
						that.post(data, that.tickets[data.proxy_key]);
						that.log(["Proxying data to the client", data]);
					}
				} else {
					if (!data.proxy_key) { // add new client
						data.proxy_key = window.Math.random().toString();
						that.tickets[data.proxy_key] = {
							source: event.source,
							origin: event.origin
						};
						that.post({
							type: "setProxy",
							proxy_key: data.proxy_key
						}, that.tickets[data.proxy_key]);
						that.log(["Client connected", data.proxy_key]);
					}
					that.post(data);
					that.log(["Proxying data to the server", data]);
				}
			} else if (data && data.type && data.type === "connect_ok") {
				that.origin = data.origin;
				that.serverKey = data.key;
				that.log("Proxy connected");
			}
		});

		this.post({
			type: "connect",
			origin: window.location.origin,
			tag: "proxy"
		});

		this.log("Proxy starting.");
	}

	pause() {
		this.paused = true;
	}

	resume() {
		this.paused = false;
	}

	post(data, customFrame) {
		if (customFrame) {
			customFrame.source.postMessage(JSON.stringify(data), customFrame.origin);
		} else {
			this.frame.postMessage(JSON.stringify(data), this.origin);
		}
	}

	log(data) {
		if (this.serverKey) {
			this.post({type: "log", log: data, key: this.serverKey});
		}
	}

}

export default ProxyServer;
