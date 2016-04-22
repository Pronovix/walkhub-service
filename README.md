# WalkHub

Walkthrough tutorials designed for web applications and websites.
Add a record button and help center to your web application.

Check the [landing page](http://pronovix.com/walkhub) for more information.

# Getting started

## Dependencies

* Go 1.5+
* PostgreSQL 9.5
* NPM
* Node.js 4.x ([5.x does not work](https://github.com/Pronovix/walkhub-service/issues/12))

## Configuration

	cp config.json.minimal config.json
	$EDITOR config.json

### Mandatory values

* `db`: connection string to the PostgreSQL database
* `secret`: 32 bytes long random byte sequence, encoded with hex encoding
* `cookiesecret`: 32 bytes long random byte sequence, encoded with hex encoding
* `baseurl`: the url where WalkHub will be. A default is set in the example config files.

At least one of the following authentication providers are mandatory:

* `google`: OAuth2 tokens for Google (see config.json.sample.full)
* `pwauth`: password authentication

If password authentication is enabled, then SMTP credentials are mandatory:

* `smtp`: SMTP credentials (see config.json.sample.full)

### Optional values

If unsure, leave them empty.

* `host`: host to listen on. Defaults to `localhost`.
* `port`: port to listen on. Defaults to `8080`.
* `httpaddr`: enables HTTP to HTTPS automatic redirection. The format of the address is `host:port`.
* `httporigin`: if this is set, the HTTP requests will be forced to a separate domain.
* `redirectall`: redirects all HTTP requests to HTTPS if the server is running in HTTPS mode. If this is set to false, only a few pages will be enabled in HTTP mode
* `contentpages`: path to a JSON file that describes custom pages. The JSON file is a simple dictionary, where the key is the path (see react-router for the syntax) and the value is the `require()` path for the component
* `frontpagecomponent`: overrides the component for the front page
* `menuitems`: path to a JSON file that describes menu paths. Only change this if you want to change the menu of the site. See `js/components/wrappers/app.js` for more info on the structure.

## Build & Run

First you have to build the assets:

	npm install
	npm run build

Run the server:

	go run cmd/walkhub/main.go

# Contribution

Feel free to open an issue or a pull request if you have questions / bugs / patches.
