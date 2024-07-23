import { normalize } from 'path';
import type * as webpack from 'webpack';
import ts from 'typescript/lib/tsserverlibrary.js';
import { getConfigPath, getTransformers, scanDirective } from '../compiler/compiler.js';

let host: ts.CompilerHost;
let program: ts.Program;
let transformers: ts.CustomTransformers;


/**
 * The entry point for ts-loader
 */

export function initTypeScript() {
	const configPath = getConfigPath();
	const cmd = ts.getParsedCommandLineOfConfigFile(configPath, {}, ts.sys as any);
	if (!cmd) {
		console.log(`can't parse command line `);
		throw new Error('');
	}
	host = ts.createCompilerHost(cmd.options);
	program = ts.createProgram(cmd.fileNames, cmd.options, host);
	transformers = getTransformers(program);
	scanDirective(program);
}

export function loader(this: webpack.LoaderContext<{}>, contents: string, inputSourceMap?: Record<string, any>) {
	if (!program) {
		try {
			initTypeScript();
		} catch (e) {
			this.callback(e as Error);
		}
	}
	let content: string | undefined, sourceMap: string | undefined;
	host.writeFile = (fileName: string, contents: string) => {
		if (fileName.endsWith('.map')) {
			sourceMap = contents;
		} else if (fileName.endsWith('.js')) {
			content = contents;
		}
	};
	const filePath = normalize(this.resourcePath);
	program.emit(program.getSourceFile(filePath), undefined, undefined, undefined, transformers);
	this.callback(null, content, sourceMap);
}
