import typescript from '@rollup/plugin-typescript';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import html from 'rollup-plugin-html';
import css from 'rollup-plugin-css-only';

export const config = {
	input: 'src/index.ts',
	output: {
		file: 'dist/index.js',
		format: 'es',
		sourcemap: true
	},
	plugins: [
		nodeResolve(),
		typescript(),
		html({ include: "**/*.html" }),
		css({ output: 'style.css' }),
	]
};

export default config;