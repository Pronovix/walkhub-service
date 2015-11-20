"use strict";

var webpack = require("webpack");
var HtmlWebpackPlugin = require("html-webpack-plugin");
var serverConfig = require("./config.json");

var path = require("path");
var srcPath = path.join(__dirname, "js");
var compassPath = path.resolve(__dirname, "./node_modules/compass-mixins/lib");
var sassPath = path.resolve(__dirname, "sass");
var sassIncludePaths = "includePaths[]="+compassPath+"&includePaths[]="+sassPath;

module.exports = {
	target: "web",
	cache: true,
	entry: {
		app: [
			"react",
			"react-router",
			"alt",
			"bootstrap-webpack!"+path.join(__dirname, "bootstrap.config.js"),
			path.join(srcPath, "module.js")
		],
		client: [
			"walkthrough.scss",
			"client/walkthrough_start"
		],
		embed: [
			"client/embed"
		]
	},
	resolve: {
		root: srcPath,
		extensions: ["", ".js", ".less"],
		modulesDirectories: ["node_modules", "js", "sass", "."],
	},
	output: {
		path: path.join(__dirname, "assets"),
		publicPath: serverConfig.baseurl + "assets/",
		filename: "[name].js",
		pathInfo: true
	},
	module: {
		loaders: [
			{
				test: /\.js?$/,
				exclude: [/node_modules/, /bootstrap\.config\.js/],
				loader: "babel-loader"
			},
			{ test: /bootstrap\/js\//, loader: 'imports?jQuery=jquery' },
			{ test: /\.(woff|woff2)(\?v=\d+\.\d+\.\d+)?$/,   loader: "url?limit=10000&mimetype=application/font-woff" },
			{ test: /\.ttf(\?v=\d+\.\d+\.\d+)?$/,    loader: "url?limit=10000&mimetype=application/octet-stream" },
			{ test: /\.eot(\?v=\d+\.\d+\.\d+)?$/,    loader: "file" },
			{ test: /\.svg(\?v=\d+\.\d+\.\d+)?$/,    loader: "url?limit=10000&mimetype=image/svg+xml" },
			{ test: /\.scss$/, loader: "style!css!sass?"+sassIncludePaths },
			{ test: /\.sass$/, loader: "style!css!sass?indentedSyntax&"+sassIncludePaths },
			{ test: /.*\.(gif|png|jpe?g|svg)$/i, loader: "file" }
		]
	},
	plugins: [
		new webpack.ProvidePlugin({
			$: "jquery",
			jQuery: "jquery"
		}),
		new HtmlWebpackPlugin({
			inject: true,
			template: "html/index.html",
			excludeChunks: ["client", "embed"]
		}),
		new HtmlWebpackPlugin({
			inject: true,
			template: "html/start.html",
			excludeChunks: ["app", "embed"],
			filename: "start.html"
		}),
		new webpack.DefinePlugin({
			WALKHUB_URL: JSON.stringify(serverConfig.baseurl),
			WALKHUB_EMBED_URL: JSON.stringify(serverConfig.embedurl)
		}),
		new webpack.NoErrorsPlugin(),
		new webpack.optimize.OccurenceOrderPlugin(),
		new webpack.optimize.DedupePlugin()
	],
	debug: true,
	devtool: "source-map",
	devServer: {
		contentBase: "./assets",
		historyApiFallback: true
	}
};
