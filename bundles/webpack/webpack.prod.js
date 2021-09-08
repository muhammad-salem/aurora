const path = require('path');

const commonConfig = require('./common.config.js');

const prodConfig = {
	mode: 'production',
};


module.exports = Object.assign({}, commonConfig, prodConfig);
