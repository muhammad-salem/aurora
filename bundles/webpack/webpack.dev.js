const path = require('path');

const commonConfig = require('./common.config.js');

const devConfig = {
	devtool: "inline-source-map",
	mode: 'development',
	devServer: {
		static: {
			directory: path.join(__dirname, 'dist'),
		},
		compress: false,
		port: 9000,
	},
};


module.exports = Object.assign({}, commonConfig, devConfig);
