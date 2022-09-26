import ts from 'typescript/lib/tsserverlibrary.js';
import preCompileComponentOptions from '../transformer/component.js';

export function compileFiles(files: readonly string[], options: ts.CompilerOptions) {
	const host = ts.createCompilerHost(options);
	const program = ts.createProgram(files, options, host);
	program.emit(undefined, undefined, undefined, undefined, {
		before: [
			preCompileComponentOptions(program),
		],
		after: [
			// before(program),
		],
		afterDeclarations: [

		],
	});
}

export function compileAndWatchFiles(configPath: string, cmd: ts.ParsedCommandLine) {
	const host = ts.createWatchCompilerHost(configPath, cmd.options, ts.sys);
	const programFactory = ts.createWatchProgram(host);
	const programBuilder = programFactory.getProgram();
	const program = programBuilder.getProgram();
	program.emit(undefined, undefined, undefined, undefined, {
		before: [
			preCompileComponentOptions(program),
		],
		after: [
			// before(program),
		],
		afterDeclarations: [

		],
	});
}


function getConfigPath() {
	const configPath = ts.findConfigFile(
		'./',			/*searchPath*/
		ts.sys.fileExists,
		'tsconfig.json'
	);
	if (!configPath) {
		throw new Error("Could not find a valid 'tsconfig.json'.");
	}
	return configPath;
}

export function compileArgs() {
	const configPath = getConfigPath();
	const cmd = ts.getParsedCommandLineOfConfigFile(configPath, {}, ts.sys as any);
	if (!cmd) {
		return;
	}
	compileFiles(cmd.fileNames, cmd.options);
}

export function compileAndWatchArgs() {
	const configPath = getConfigPath();
	const cmd = ts.getParsedCommandLineOfConfigFile(configPath, {}, ts.sys as any);
	if (!cmd) {
		return;
	}
	compileAndWatchFiles(configPath, cmd);
}
