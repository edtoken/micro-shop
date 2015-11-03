var LiveReloadPlugin = require("webpack-livereload-plugin");
var webpack = require('webpack');
var config = require('./default.config');

var LIVERELOAD_PORT = 35738;

config.plugins.push(new webpack.DefinePlugin({
	__DEVELOPMENT__: true,
	__LIVERELOAD_PORT__: LIVERELOAD_PORT
}));

config.plugins.push(new LiveReloadPlugin({port: LIVERELOAD_PORT}));

module.exports = config