import typescript from '@rollup/plugin-typescript';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import html from 'rollup-plugin-html';
import css from 'rollup-plugin-css-only';
import {
	beforeCompileDirectiveOptions, beforeCompileComponentOptions,
	afterDeclarationsCompileComponentOptions,
	afterDeclarationsCompileDirectiveOptions,
	scanDirectivesOnceAsTransformer,
} from '@ibyar/cli';


export const config = {
	input: 'src/index.ts',
	output: {
		dir: 'dist',
		format: 'es',
		sourcemap: true
	},
	plugins: [
		nodeResolve(),
		typescript({
			transformers: {
				before: [
					{ type: 'program', factory: scanDirectivesOnceAsTransformer() },
					{ type: 'program', factory: beforeCompileDirectiveOptions },
					{ type: 'program', factory: beforeCompileComponentOptions },
				],
				after: [],
				afterDeclarations: [
					{ type: 'program', factory: afterDeclarationsCompileComponentOptions },
					{ type: 'program', factory: afterDeclarationsCompileDirectiveOptions },
				],
			}
		}),
		html({ include: "**/*.html" }),
		css({ output: 'style.css' }),
	],
	inlineDynamicImports: true,
};

export default config;