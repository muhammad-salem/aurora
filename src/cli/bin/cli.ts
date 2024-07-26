#!/usr/bin/env node

import { join } from 'path';
import { exit } from 'process';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';

const args = process.argv;
const inputs = args.slice(2);

const showHelp = inputs.includes('-h') || inputs.includes('--help');
const printVersion = inputs.length === 1 && (inputs.includes('-v') || inputs.includes('--version'));

const runBuild = inputs.includes('-b') || inputs.includes('--build');

if (showHelp) {
	const help =
		`
Version ${readPackageVersion()}
Usage: ibyar [options]

Examples:
    ibyar
    ibyar -b
    ibyar -b -w
    ibyar -gt
    ibyar -v
    ibyar --help

Options:
    -b      --build             compile the project source code with ibyar transformers
	                            and generate '.d.ts' files with created Custom HTML Element definitions.
	-w		--watch				compile and watch source files, used with --build
    -h      --help              print help message
    -v      --version           output the version number`;
	console.log(help);
	exit();
}


if (printVersion) {
	console.log(readPackageVersion());
}

if (runBuild) {
	import('../compiler/compiler.js').then(module => {
		if (inputs.includes('-w') || inputs.includes('--watch')) {
			module.compileAndWatchArgs();
		} else {
			module.compileArgs();
		}
	}).catch(error => console.error(error));
}

function readPackageVersion(): string {
	const url = fileURLToPath(import.meta.url);
	const path = join(url, '..', '..', 'package.json');
	const string = readFileSync(path, 'utf-8').toString();
	const { version } = JSON.parse(string) as { version: string };
	return version;
}
