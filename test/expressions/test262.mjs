import { doesNotThrow, throws, deepStrictEqual } from 'assert';
import { readdirSync, readFileSync } from 'fs';
import { getLanguageMode, JavaScriptParser } from '@ibyar/expressions';

function parse(src, { isModule, earlyErrors }) {
	console.log('src:\n', src);
	const mode = getLanguageMode(isModule);
	return JavaScriptParser.parse(src, { mode, /* earlyErrors */ });
}


let passExcludes = [
	'29e41f46ede71f11.js', '6196b3f969486455.js', '925443c6cf79aa88.js',
	'b376d3924d77aa8a.js', 'c8b9a4d186ec2eb8.js', 'e5570b178254bfb9.js',
];

let failExcludes = [];
let earlyExcludes = ['557.script.js', '558.script.js', '559.script.js', '560.script.js', '561.script.js', '563.script.js', '564.script.js', '565.script.js', '566.script.js', '567.script.js', '568.script.js', '569.script.js', '570.script.js', '571.script.js', '572.script.js', '574.script.js', '575.script.js', '576.script.js', '577.script.js', '578.script.js', '579.script.js', '580.script.js', '581.script.js', '582.script.js', '583.script.js', '585.script.js', '586.script.js', '587.script.js', '588.script.js', '589.script.js', '590.script.js', '591.script.js', '592.script.js', '593.script.js', '594.script.js', '596.script.js', '597.script.js', '598.script.js', '599.script.js', '600.script.js', '601.script.js', '602.script.js'];
earlyExcludes = [];

const errors = [];

const rootTest = './node_modules/test262-parser-tests';
let x = 0;
readdirSync(`${rootTest}/pass`)
	// .filter(f => passExcludes.includes(f))
	.forEach(f => {
		// f = 'd2d8885e0c00ad51.js';
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

x = 0;
readdirSync(`${rootTest}/fail`)
	.filter(f => !failExcludes.includes(f))
	.forEach(f => {
		console.log('parse `fail` file: ', f, ++x);
		throws(() => {
			parse(
				readFileSync(`${rootTest}/fail/${f}`, 'utf8'),
				{ isModule: f.includes('.module.js'), earlyErrors: false }
			);
		});
	});

x = 0;
readdirSync(`${rootTest}/early`)
	.filter(f => !earlyExcludes.includes(f))
	.forEach(f => {
		console.log('parse `early` file: ', f, ++x);
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
	});