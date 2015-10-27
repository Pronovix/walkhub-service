# WalkHub

Walkthrough tutorials designed for web applications and websites.
Add a record button and help center to your web application.

Check the [landing page](http://pronovix.com/walkhub) for more information.

# Getting started

## Dependencies

* Go 1.5
* PostgreSQL 9.4 (older versions might work too)
* NPM

## Configuration

	cp config.json.sample config.json
	$EDITOR config.json

* `db`: connection string to the PostgreSQL database
* `secret`: 32 bytes long random byte sequence, encoded with hex encoding
* `cookiesecret`: 32 bytes long random byte sequence, encoded with hex encoding
* `baseurl`: the url where WalkHub will be
* `httpaddr`: enables HTTP to HTTPS automatic redirection. The format of the address is `host:port`.
* `google`: OAuth2 tokens for Google

Currently only OAuth2 through Google is supported as an authentication mechanism, but other OAuth2 providers and password authentication (with 2FA support) are coming soon.

## Build & Run

First you have to build the assets:

	npm install
	npm run build

Run the server:

	go run cmd/walkhub/main.go

# Contribution

Feel free to open an issue or a pull request if you have questions / bugs / patches.
