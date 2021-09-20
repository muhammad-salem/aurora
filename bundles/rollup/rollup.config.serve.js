import config from './rollup.config.js';
import serve from 'rollup-plugin-serve';

config.plugins.push(
	serve({
		open: true,
		openPage: '/index.html',
		contentBase: ['.', 'dist'],
	})
);

export default config;
