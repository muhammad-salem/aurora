#!/usr/bin/env node

import { exit } from 'process';

const CLI_VERSION = '2.1.0';

const args = process.argv;
const inputs = args.slice(2);

const showHelp = inputs[0] === '-h' || inputs[0] === '--help';
const printVersion = inputs[0] === '-v' || inputs[0] === '--version';

const runBuild = inputs[0] === '-b' || inputs[0] === '--build';
const generateTypes = inputs[0] === '-gt' || inputs[0] === '--generate-types';

if (showHelp) {
	const help =
		`
Version ${CLI_VERSION}
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
	-w		--watch				compile and watch source files, used with --build
    -gt     --generate-types    generate "web-types.json" files, and typescript
	                            definitions '.d.ts' files. 
	                            you can import this file later in your "index.ts" 
								or "polyfills.ts" file, so any editor "VS Code" can
								support autocomplete easily,
    -h      --help              print help message
    -v      --version           output the version number`;
	console.log(help);
	exit();
}


if (printVersion) {
	console.log(CLI_VERSION);
	exit();
}

if (runBuild) {
	import('../compiler/compiler.js').then(module => {
		if (process.argv.includes('-w') || process.argv.includes('--watch')) {
			module.compileAndWatchArgs();
		} else {
			module.compileArgs();
		}
	});
}

if (generateTypes) {
	console.log('generate types not supported yet.');
}
