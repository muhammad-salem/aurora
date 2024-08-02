import '../directives/register.js';
import ts from 'typescript/lib/tsserverlibrary.js';
import { afterDeclarationsCompileComponentOptions } from '../transformer/after-declarations-component.js';
import { afterDeclarationsCompileDirectiveOptions } from '../transformer/after-declarations-directive.js';
import { beforeCompileComponentOptions } from '../transformer/before-component.js';
import { beforeCompileDirectiveOptions } from '../transformer/before-directive.js';
import { scanDirectivesTypeVisitor } from '../transformer/scan-directives.js';
import { dirname, join, resolve } from 'path';
import { existsSync } from 'fs';

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

export function scanDirectives(program: ts.Program) {
	program.getSourceFiles().forEach(scanDirectivesTypeVisitor);
}

export function scanDirectivesOnceAsTransformer() {
	let scanDone = false;
	let ignoreTransformer = (context: ts.TransformationContext): ts.Transformer<ts.SourceFile> => sourceFile => sourceFile;
	return (program: ts.Program) => {
		if (scanDone) {
			return ignoreTransformer;
		}
		scanDone = true;
		scanDirectives(program);
		return ignoreTransformer;
	};
}

export function emitProgram(program: ts.Program) {
	scanDirectives(program);
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

type ProgramPatch = ts.Program & { __emit: (targetSourceFile?: ts.SourceFile, writeFile?: ts.WriteFileCallback, cancellationToken?: ts.CancellationToken, emitOnlyDtsFiles?: boolean, customTransformers?: ts.CustomTransformers) => ts.EmitResult };

export function patchProgram(tsProgram: ts.Program) {
	const program = tsProgram as ProgramPatch;
	program.__emit = program.emit;
	const programTransformers = getTransformers(program);
	program.emit = (targetSourceFile?: ts.SourceFile, writeFile?: ts.WriteFileCallback, cancellationToken?: ts.CancellationToken, emitOnlyDtsFiles?: boolean, customTransformers?: ts.CustomTransformers): ts.EmitResult => {
		if (!customTransformers) {
			return program.__emit(targetSourceFile, writeFile, cancellationToken, emitOnlyDtsFiles, programTransformers);
		}
		return program.__emit(targetSourceFile, writeFile, cancellationToken, emitOnlyDtsFiles, {
			before: [...(customTransformers?.before ?? []), ...programTransformers.before!],
			after: [...(customTransformers?.after ?? []), ...programTransformers.after!],
			afterDeclarations: [...(customTransformers?.afterDeclarations ?? []), ...programTransformers.afterDeclarations!],
		});
	};
}

export function createEmitAndSemanticDiagnosticsBuilderProgram(rootNames: readonly string[] | undefined, options: ts.CompilerOptions | undefined, host?: ts.CompilerHost, oldProgram?: ts.EmitAndSemanticDiagnosticsBuilderProgram | undefined, configFileParsingDiagnostics?: readonly ts.Diagnostic[], projectReferences?: readonly ts.ProjectReference[] | undefined) {
	const program = ts.createEmitAndSemanticDiagnosticsBuilderProgram(rootNames, options, host, oldProgram, configFileParsingDiagnostics, projectReferences);
	scanDirectives(program.getProgram());
	patchProgram(program.getProgram());
	return program;
}

export function compileSolution(configFilePath: string, cmd: ts.ParsedCommandLine) {
	const rootNames = [dirname(configFilePath)];
	const solutionHost = ts.createSolutionBuilderHost(ts.sys, createEmitAndSemanticDiagnosticsBuilderProgram);
	const solution = ts.createSolutionBuilder(solutionHost, rootNames, { ...cmd.options, incremental: true });
	solution.build();
}

export function compileSolutionAndWatch(configFilePath: string, cmd: ts.ParsedCommandLine) {
	const rootNames = [dirname(configFilePath)];
	const solutionHost = ts.createSolutionBuilderWithWatchHost(ts.sys, createEmitAndSemanticDiagnosticsBuilderProgram);
	const solution = ts.createSolutionBuilderWithWatch(solutionHost, rootNames, { incremental: false }, cmd.watchOptions);
	solution.build();
}

export function getConfigPath() {
	const args = process.argv.slice(2);
	let tsconfig = args.filter(arg => arg.includes('tsconfig'))[0];
	if (!tsconfig && args.length > 1 /** -b */) {
		const path = join(args.at(-1)!, 'tsconfig.json');
		if (existsSync(path)) {
			tsconfig = resolve(path);
		}
	}
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
	if (cmd.projectReferences?.length) {
		compileSolution(configPath, cmd);
	} else {
		compileFiles(cmd.fileNames, cmd.options);
	}
}

export function compileAndWatchArgs() {
	const configPath = getConfigPath();
	const cmd = ts.getParsedCommandLineOfConfigFile(configPath, {}, ts.sys as any);
	if (!cmd) {
		return;
	}
	if (cmd.projectReferences?.length) {
		compileSolutionAndWatch(configPath, cmd);
	} else {
		compileAndWatchFiles(configPath, cmd);
	}
}
