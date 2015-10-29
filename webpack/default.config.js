var path = require('path');
var webpack = require('webpack');
var CleanPlugin = require('clean-webpack-plugin');
var ExtractTextPlugin = require('extract-text-webpack-plugin');
var LiveReloadPlugin = require("webpack-livereload-plugin");

var coreDir = path.join(__dirname, '../');
var buildPath = path.join(coreDir, './build');

module.exports = {

	entry: {
		main: './src/js/main'
	},

	output: {
		path: buildPath,
		filename: '[name].js',
		chunkFilename: '[name].js',
		publicPath: '/'
	},

	module: {
		loaders: [
			{test: /\.(jpe?g|png|gif|svg)$/, loader: 'url', query: {limit: 10240}},
			{test: /\.js$/, exclude: /node_modules/, loader: "babel-loader?experimental&optional=runtime"},
			{test: /\.jsx$/, exclude: /node_modules/, loader: "babel-loader?experimental&optional=runtime"},
			{test: /\.json$/, loader: 'json-loader'},
			{
				test: /\.scss$/,
				loader: ExtractTextPlugin.extract('style',
					'css?modules&importLoaders=2' +
					'!autoprefixer?browsers=last 2 version' +
					'!sass?outputStyle=expanded&sourceMap=true&sourceMapContents=true')
			}
		]
	},

	progress: true,
	resolve: {

		root: path.resolve(coreDir, './src'),
		modulesDirectories: [
			'js',
			'node_modules'
		],
		extensions: ['', '.json', '.js', '.jsx'],

		alias: {
		}
	},

	plugins: [
		new CleanPlugin([buildPath]),
		new webpack.WatchIgnorePlugin([/\.json$/])
	]
}