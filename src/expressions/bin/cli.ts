#!/usr/bin/env node

import { exit } from 'process';
import { readFileSync, writeFileSync } from 'fs';
import { JavaScriptParser } from '../index.js';

const CLI_VERSION = '1.0.1';

const args = process.argv;
const inputs = args.slice(2);

const showHelp = inputs.includes('h') || inputs.includes('help');

if (showHelp) {
	const help =
		`
Version ${CLI_VERSION}
Usage: 

	- expr run [js file/module] [watcher<w> [js watch file]]
	- expr parse [js file/module] out [ast file name]
	- expr version
	- expr help

Examples:
    expr run hello.js
    expr run hello.js watcher monitor.js
    expr r hello.js w monitor.js
    expr parse hello.js 
    expr parse hello.js out hello.ast
    expr p hello.js o hello.ast
    expr version
    expr v
    expr help
    expr h

Options:
    r		run				run js file
    p		parse			parse js file to AST object
	o		out				output path
	w		watcher			monitor file
    h		help			print help message
    v		version			output the version number`;
	console.log(help);
	exit();
}


const printVersion = inputs.includes('v') || inputs.includes('version');
if (printVersion) {
	console.log(CLI_VERSION);
	exit();
}

const parseFile = inputs.includes('p') || inputs.includes('parse');
const path = inputs.find((v, i, arr) => arr[i - 1] === 'p' || arr[i - 1] === 'parse');
if (parseFile && path) {
	const script = readFileSync(path, 'utf8').toString();

	const ast = JavaScriptParser.parse(script);
	const json = JSON.stringify(ast);

	const writeOut = inputs.includes('o') || inputs.includes('out');
	const outPath = inputs.find((v, i, arr) => arr[i - 1] === 'o' || arr[i - 1] === 'out');

	if (writeOut && outPath) {
		writeFileSync(outPath, json);
	} else {
		console.log(ast);
	}
	exit();
}

const runScript = inputs.includes('r') || inputs.includes('run');
if (runScript) {
	console.log('not implemented yet.');
}
