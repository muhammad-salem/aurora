import ts from 'typescript/lib/tsserverlibrary.js';
import before from '../transformer/before.js';

export function compileFiles(files: readonly string[], options: ts.CompilerOptions) {
	const host = ts.createCompilerHost(options);
	const program = ts.createProgram(files, options, host);
	program.emit(undefined, undefined, undefined, undefined, {
		before: [
			before(program),
		],
		after: [
			// before(program),
		],
		afterDeclarations: [

		],
	});
}



export function compileArgs() {
	const configPath = ts.findConfigFile(
    /*searchPath*/ "./",
		ts.sys.fileExists,
		"tsconfig.json"
	);
	if (!configPath) {
		throw new Error("Could not find a valid 'tsconfig.json'.");
	}

	// const cmd = ts.parseCommandLine(argv.slice(2));
	const cmd = ts.getParsedCommandLineOfConfigFile(configPath, {}, ts.sys as any);
	if (!cmd) {
		return;
	}
	compileFiles(cmd.fileNames, cmd.options);
}
