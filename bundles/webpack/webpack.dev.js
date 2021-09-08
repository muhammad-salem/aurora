const path = require('path');

const commonConfig = require('./common.config.js');

const devConfig = {
	devtool: 'source-map',
	mode: 'development',
	devServer: {
		static: {
			directory: path.join(__dirname, 'dist'),
		},
		compress: true,
		port: 9000,
	},
};


module.exports = Object.assign({}, commonConfig, devConfig);
