import { normalize } from 'path';
import ts from 'typescript/lib/tsserverlibrary.js';
import { getConfigPath, getTransformers, scanDirectives } from '../compiler/compiler.js';

let host: ts.CompilerHost;
let program: ts.Program;
let orgWriteFile: ts.WriteFileCallback;
let transformers: ts.CustomTransformers;

interface webpackLoaderContext {

	resourcePath: string;

	callback(e: Error): void;

	callback(e: null, content?: string, sourceMap?: string): void;

}

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
	orgWriteFile = host.writeFile;
	program = ts.createProgram(cmd.fileNames, cmd.options, host);
	transformers = getTransformers(program);
	scanDirectives(program);
}

export function loader(this: webpackLoaderContext, contents: string, inputSourceMap?: Record<string, any>) {
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
	host.writeFile = orgWriteFile;
}
