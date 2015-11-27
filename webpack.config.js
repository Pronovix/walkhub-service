"use strict";

var webpack = require("webpack");
var HtmlWebpackPlugin = require("html-webpack-plugin");
var ExtractTextPlugin = require("extract-text-webpack-plugin");
var serverConfig = require("./config.json");

var path = require("path");
var srcPath = path.join(__dirname, "js");
var compassPath = path.resolve(__dirname, "./node_modules/compass-mixins/lib");
var sassPath = path.resolve(__dirname, "sass");
var sassIncludePaths = "includePaths[]="+compassPath+"&includePaths[]="+sassPath;

var loaders = [
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
	{ test: /\.less$/, loader: ExtractTextPlugin.extract("style-loader", "css-loader!less-loader") },
	{ test: /\.css$/, loader: ExtractTextPlugin.extract("style-loader", "css-loader") },
	{ test: /\.scss$/, loader: "style!css!sass?"+sassIncludePaths },
	{ test: /\.sass$/, loader: "style!css!sass?indentedSyntax&"+sassIncludePaths },
	{ test: /.*\.(gif|png|jpe?g|ico)$/i, loader: "file?name=[name]-[sha512:hash:hex:6].[ext]" }
];

if (serverConfig.contentpages) {
	loaders.push({
		test: function(absPath) {
			return absPath.endsWith(serverConfig.contentpages);
		},
		loader: "contentpageconfig"
	});
}

if (serverConfig.menuitems) {
	loaders.push({
		test: function(absPath) {
			return absPath.endsWith(serverConfig.menuitems);
		},
		loader: "json"
	});
}

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
		alias: {
			CONTENT_PAGES: serverConfig.contentpages,
			MENU_ITEMS: serverConfig.menuitems,
			FRONT_PAGE: serverConfig.frontpagecomponent || "components/wrappers/frontpage"
		},
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
		loaders: loaders
	},
	plugins: [
		new webpack.ProvidePlugin({
			$: "jquery",
			jQuery: "jquery"
		}),
		new ExtractTextPlugin("[name].css"),
		new HtmlWebpackPlugin({
			inject: true,
			template: "html?attrs[]=link:href!html/index.html",
			chunks: ["app"],
			hash: true
		}),
		new HtmlWebpackPlugin({
			inject: true,
			template: "html/start.html",
			chunks: ["client"],
			filename: "start.html",
			hash: true
		}),
		new webpack.DefinePlugin({
			WALKHUB_URL: JSON.stringify(serverConfig.baseurl),
			WALKHUB_EMBED_URL: JSON.stringify(serverConfig.embedurl ? serverConfig.embedurl : serverConfig.baseurl),
			WALKHUB_HTTP_URL: JSON.stringify(serverConfig.httporigin ? serverConfig.httporigin : serverConfig.baseurl),
			WALKHUB_MENU_ITEMS: !!serverConfig.menuitems,
			WALKHUB_CONTENT_PAGES: !!serverConfig.contentpages
		}),
		new webpack.NoErrorsPlugin(),
		new webpack.optimize.OccurenceOrderPlugin(),
		new webpack.optimize.DedupePlugin()
	],
	resolveLoader: {
		extensions: ["", ".js"],
		modulesDirectories: ["node_modules", "js/build"]
	},
	debug: true,
	devtool: "source-map",
	devServer: {
		contentBase: "./assets",
		historyApiFallback: true
	}
};
