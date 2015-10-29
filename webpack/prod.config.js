var webpack = require('webpack');
var config = require('./dev.config');

config.plugins.push(new webpack.DefinePlugin({
	__DEVELOPMENT__: false
}));

config.plugins.push(new webpack.optimize.UglifyJsPlugin({minimize: true, compress: { warnings: true } }));

module.exports = config