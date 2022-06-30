import { doesNotThrow, throws, deepStrictEqual } from 'assert';
import { readdirSync, readFileSync } from 'fs';
import { getLanguageMode, JavaScriptParser } from '@ibyar/expressions';

function parse(src, { isModule, earlyErrors }) {
	console.log('src:\n', src);
	const mode = getLanguageMode(isModule);
	return JavaScriptParser.parse(src, { mode, /* earlyErrors */ });
}


let passExcludes = [];
let failExcludes = [];
let earlyExcludes = [];

const errors = [];

const rootTest = './node_modules/test262-parser-tests';
let x = 0;
readdirSync(`${rootTest}/pass`)
	.filter(f => !passExcludes.includes(f))
	.forEach(f => {
		// f = 'ce5f3bc27d5ccaac.js';
		console.log('parse `pass` file: ', f, ++x);
		let firstTree, secondTree;
		try {
			doesNotThrow(() => {
				firstTree = parse(
					readFileSync(`${rootTest}/pass/${f}`, 'utf8'),
					{ isModule: f.includes('.module.js'), earlyErrors: true }
				);
			});
			doesNotThrow(() => {
				secondTree = parse(
					readFileSync(`${rootTest}/pass-explicit/${f}`, 'utf8'),
					{ isModule: f.includes('.module.js'), earlyErrors: true }
				);
			});
			// const firstAST = JSON.stringify(firstTree);
			// const secondAST = JSON.stringify(secondTree);
			// console.log('firstTree', firstTree.toString(), firstAST);
			// console.log('secondTree', secondTree.toString(), secondAST);
			// deepStrictEqual(firstAST, secondAST);
		} catch (error) {
			// console.error('error', f, error);
			console.error('error', f, readFileSync(`${rootTest}/pass/${f}`, 'utf8'), readFileSync(`${rootTest}/pass-explicit/${f}`, 'utf8'));
			errors.push(f);
			// throw error;
		}
	});

printErrors(errors);
errors.splice(0);

x = 0;
readdirSync(`${rootTest}/fail`)
	.filter(f => !failExcludes.includes(f))
	.forEach(f => {
		console.log('parse `fail` file: ', f, ++x);
		try {
			throws(() => {
				parse(
					readFileSync(`${rootTest}/fail/${f}`, 'utf8'),
					{ isModule: f.includes('.module.js'), earlyErrors: false }
				);
			});
		} catch (error) {
			// console.error('error', f, error);
			console.error('error', f, readFileSync(`${rootTest}/fail/${f}`, 'utf8'));
			errors.push(f);
			// throw error;
		}
	});

printErrors(errors);
errors.splice(0);
x = 0;
readdirSync(`${rootTest}/early`)
	.filter(f => !earlyExcludes.includes(f))
	.forEach(f => {
		console.log('parse `early` file: ', f, ++x);
		try {
			doesNotThrow(() => {
				parse(
					readFileSync(`${rootTest}/early/${f}`, 'utf8'),
					{ isModule: f.includes('.module.js'), earlyErrors: false }
				);
			});
			throws(() => {
				parse(
					readFileSync(`${rootTest}/early/${f}`, 'utf8'),
					{ isModule: f.includes('.module.js'), earlyErrors: true }
				);
			});
		} catch (error) {
			// console.error('error', f, error);
			console.error('error', f, readFileSync(`${rootTest}/early/${f}`, 'utf8'));
			errors.push(f);
			// throw error;
		}

	});

printErrors(errors);

function printErrors(errors) {
	const errorString = errors
		.sort((a, b) => {
			if (a.endsWith('.module.js') && b.endsWith('.module.js')) {
				return a.localeCompare(b);
			} else if (a.endsWith('.module.js')) {
				return -1;
			} if (b.endsWith('.module.js')) {
				return 1;
			} else {
				return a.localeCompare(b);
			}
		})
		.map(JSON.stringify)
		.map(s => s.replace(/"/g, "'"))
		.map((s, i) => ((i + 1) % 3) ? s + ',' : `${s},\n`).join('');
	console.log('pass errors', errors.length, `[\n${errorString}]`);
}