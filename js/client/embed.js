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

import $ from "jquery";
import {MAXIMUM_ZINDEX, isHTTPSPage} from "util";

window.WalkhubWidgetPositions = window.WalkhubWidgetPositions || {
	"bottom-left": [],
	"bottom-right": [],
	"top-left": [],
	"top-right": [],
};

function isExtension() {
	return window.chrome && window.chrome.runtime && window.chrome.runtime.id;
}

function reposition(iframe) {
	const position = iframe.data("position");
	if (!position) {
		return;
	}

	const width = iframe.width();
	const [y, x] = position.split("-");

	const ticket = iframe.data("ticket");
	if (!ticket) {
		return;
	}

	let iframeIdx = -1;
	for (let i in window.WalkhubWidgetPositions[position]) {
		if (window.WalkhubWidgetPositions[position][i].iframe.data("ticket") === ticket) {
			iframeIdx = i;
			break;
		}
	}

	if (iframeIdx === -1) {
		let highestX = 0;
		let hightestXWidth = 0;
		for (let i in window.WalkhubWidgetPositions[position]) {
			if (window.WalkhubWidgetPositions[position][i].x > highestX) {
				highestX = window.WalkhubWidgetPositions[position][i].x;
				hightestXWidth = window.WalkhubWidgetPositions[position][i].width;
			}
		}

		window.WalkhubWidgetPositions[position].push({
			iframe: iframe,
			x: highestX + hightestXWidth,
			width: width,
		});
	}

	let lastX = 0;
	for (let i in window.WalkhubWidgetPositions[position]) {
		window.WalkhubWidgetPositions[position][i].width = window.WalkhubWidgetPositions[position][i].iframe.width();
		window.WalkhubWidgetPositions[position][i].x = lastX;
		window.WalkhubWidgetPositions[position][i].iframe.css(x, lastX+"px");
		lastX += window.WalkhubWidgetPositions[position][i].width;
	}

	iframe
		.css("position", "fixed")
		.css(y, "0")
	;
}

function fixIFrameSize(iframe) {
	iframe.attr("style", "");
	const state = iframe.data("state") || "";
	let width = "";
	let height = "";

	switch (iframe.data("type")) {
		case "play":
			width = 55;
			height = 35;
			break;
		case "record":
			switch (state) {
				case "": // starting state
					width = 90;
					height = 35;
					break;
				case "recorded":
					width = null; // 100%
					height = 130;
					break;
				case "saved":
					width = null;
					height = 140;
					break;
			}

			iframe
				.css("max-width", "200px")
				.css("max-height", "230px")
			;
			break;
		case "search":
			switch (state) {
				case "":
					width = 105;
					height = 35;
					break;
				case "list":
					width = 600;
					height = 400;
					break;
			}
			break;
		case "list":
			switch (state) {
				case "":
					width = 105;
					height = 35;
					break;
				case "list":
					width = 400;
					height = 400;
					break;
			}
			break;
	}

	iframe
		.css("width", width ? width + "px" : "100%")
		.css("height", height ? height + "px" : "100%")
		.css("z-index", MAXIMUM_ZINDEX-1)
		.css("position", "relative")
	;

	// Reposition multiple times with a delay.
	// This is needed, because sometimes the CSS application above
	// does not execute fast enough, and the reposition() call uses
	// wrong widths.
	setTimeout(() => reposition(iframe), 500);
	setTimeout(() => reposition(iframe), 1000);
	reposition(iframe);
}

function processButton(button) {
	const ticket = Math.random().toString();
	const uuid = button.data("uuid") || null;
	const position = button.data("position") || "";
	const search = button.data("search") || null;
	const listURL = button.data("listUrl") || null;
	const origin = isHTTPSPage() || isExtension() ? WALKHUB_URL : WALKHUB_HTTP_URL;
	let uri = origin + "record?embedded=1&start=" + (isExtension() ? "&extension=1" : encodeURIComponent(window.location.href));
	let type = "record";
	if (uuid) {
		uri = origin + "walkthrough/" + uuid + "?embedded=1";
		type = "play";
	} else if (search) {
		uri = origin + "search?embedded=1&q=" + encodeURIComponent(search);
		type = "search";
	} else if (listURL) {
		uri = origin + "helpcenterlist?embedded=1&url=" + encodeURIComponent(listURL);
		type = "list";
	}

	const iframe = $("<iframe />")
		.attr("src", uri +
			"&embedorigin=" + encodeURIComponent(window.location.origin) +
			"&ticket=" + ticket)
		.attr("frameborder", 0)
		.attr("scrolling", "auto")
		.attr("allowtransparency", "true")
		.data("type", type)
		.data("position", position)
		.data("ticket", ticket)
	;

	fixIFrameSize(iframe);

	button.append(iframe).data("ticket", ticket);
}

function onMessageEventHandler(event) {
	const w = $(window);
	const msg = JSON.parse(event.data);

	// TODO this is a workaround.
	// If we intercept a connect_ok message, it means that we are in a
	// playing or recording session.
	if (msg.type === "connect_ok") {
		$(".walkthroughbutton")
			.filter(function() { return $(this).data("origin") === WALKHUB_URL; })
			.html("");
		window.removeEventListener("message", onMessageEventHandler);
		return;
	}

	const iframe = $(".walkthroughbutton")
		.filter(function() { return $(this).data("ticket") === msg.ticket; })
		.find("iframe");

	if (!iframe || !iframe.length) {
		return;
	}

	console.log("EMBED RECV " + event.data);

	switch (msg.type) {
		case "start":
			iframe
				.data("started", true)
				.css("position", "fixed")
				.css("z-index", MAXIMUM_ZINDEX)
				.css("left", "0px")
				.css("top", "0px")
			;
			w
				.bind("resize.whembed", function () {
					iframe
						.css("width", w.width() + "px")
						.css("max-width", w.width() + "px")
						.css("height", w.height() + "px")
						.css("max-height", w.height() + "px")
					;
				})
				.resize();
			break;
		case "end":
			w.unbind("resize.whembed");
			iframe
				.data("started", false)
				.attr("style", "")
			;
			fixIFrameSize(iframe);
			break;
		case "embedState":
			iframe.data("state", msg.state);
			if (!iframe.data("started")) {
				fixIFrameSize(iframe);
			}
			break;
	}
}

window.WalkhubEmbedJS = window.WalkhubEmbedJS || {};

if (!window.WalkhubEmbedJS[WALKHUB_URL]) {
	window.WalkhubEmbedJS[WALKHUB_URL] = true;
	$(function() {
		$(".walkthroughbutton:not(.processed)")
			.filter(function() { return $(this).data("origin") === WALKHUB_URL; })
			.addClass("processed")
			.each(function() {
				processButton($(this));
			});

		window.addEventListener("message", onMessageEventHandler);
	});
}
