import '../directives/register.js';
import ts from 'typescript/lib/tsserverlibrary.js';
import { afterDeclarationsCompileComponentOptions } from '../transformer/after-declarations-component.js';
import { afterDeclarationsCompileDirectiveOptions } from '../transformer/after-declarations-directive.js';
import { beforeCompileComponentOptions } from '../transformer/before-component.js';
import { beforeCompileDirectiveOptions } from '../transformer/before-directive.js';
import { scanDirectivesTypeVisitor } from '../transformer/scan-directives.js';

export function getTransformers(program: ts.Program): ts.CustomTransformers {
	return {
		before: [
			beforeCompileDirectiveOptions(program),
			beforeCompileComponentOptions(program),
		],
		after: [],
		afterDeclarations: [
			afterDeclarationsCompileComponentOptions(program) as ts.TransformerFactory<ts.SourceFile | ts.Bundle>,
			afterDeclarationsCompileDirectiveOptions(program) as ts.TransformerFactory<ts.SourceFile | ts.Bundle>,
		],
	};
}

export function scanDirective(program: ts.Program) {
	program.getSourceFiles().forEach(scanDirectivesTypeVisitor);
}

export function emitProgram(program: ts.Program) {
	scanDirective(program);
	program.emit(undefined, undefined, undefined, undefined, getTransformers(program));
}

export function compileFiles(files: readonly string[], options: ts.CompilerOptions) {
	const host = ts.createCompilerHost(options);
	const program = ts.createProgram(files, options, host);
	emitProgram(program);
}

const formatHost: ts.FormatDiagnosticsHost = {
	getCanonicalFileName: path => path,
	getCurrentDirectory: ts.sys.getCurrentDirectory,
	getNewLine: () => ts.sys.newLine
};

function reportDiagnostic(diagnostic: ts.Diagnostic) {
	console.error("Error", diagnostic.code, ":", ts.flattenDiagnosticMessageText(diagnostic.messageText, formatHost.getNewLine()));
}

/**
 * Prints a diagnostic every time the watch status changes.
 * This is mainly for messages like "Starting compilation" or "Compilation completed".
 */
function reportWatchStatusChanged(diagnostic: ts.Diagnostic) {
	console.info(ts.formatDiagnostic(diagnostic, formatHost));
}

export function compileAndWatchFiles(configPath: string, cmd: ts.ParsedCommandLine) {
	const createProgram = ts.createSemanticDiagnosticsBuilderProgram;
	const host = ts.createWatchCompilerHost(
		configPath,
		cmd.options,
		ts.sys,
		createProgram,
		reportDiagnostic,
		reportWatchStatusChanged,
		cmd.watchOptions,
	);
	const programFactory = ts.createWatchProgram(host);
	const programBuilder = programFactory.getProgram();
	const program = programBuilder.getProgram();
	emitProgram(program);
}



export function getConfigPath() {
	const tsconfig = process.argv.slice(2).filter(arg => arg.includes('tsconfig'))[0];
	const configPath = ts.findConfigFile(
		'./',			/*searchPath*/
		ts.sys.fileExists,
		tsconfig ?? 'tsconfig.json'
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
