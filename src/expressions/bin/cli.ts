#!/usr/bin/env node

import { exit } from 'process';
import { readFileSync, writeFileSync } from 'fs';
import { JavaScriptParser, Stack } from '../index.js';

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

function isContain(small: string, big: string) {
	return {
		found: inputs.includes(small) || inputs.includes(big),
		path: inputs.find((v, i, arr) => arr[i - 1] === small || arr[i - 1] === big),
	};
}

const isParse = isContain('p', 'parse');
if (isParse.found && isParse.path) {
	const script = readFileSync(isParse.path, 'utf8').toString();

	const ast = JavaScriptParser.parse(script);
	const json = JSON.stringify(ast);


	const isOut = isContain('o', 'out');

	if (isOut.found && isOut.path) {
		writeFileSync(isOut.path, json);
	} else {
		console.log(ast);
	}
	exit();
}

const isRun = isContain('r', 'run');
if (isRun.found && isRun.path) {
	const script = readFileSync(isRun.path, 'utf8').toString();

	const ast = JavaScriptParser.parse(script);
	const stack = Stack.for([globalThis]);
	ast.get(stack);
}

