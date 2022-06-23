import { doesNotThrow, throws, deepStrictEqual } from 'assert';
import { readdirSync, readFileSync } from 'fs';
import { getLanguageMode, JavaScriptParser } from '@ibyar/expressions';

function parse(src, { isModule, earlyErrors }) {
	console.log('src:\n', src);
	JavaScriptParser.parse(src, { mode: getLanguageMode(isModule), /* earlyErrors */ });
	// return JavaScriptParser.parse(src, { mode: getLanguageMode(isModule), /* earlyErrors */ });
}

let passExcludes = [];
let failExcludes = [];
let earlyExcludes = ['557.script.js', '558.script.js', '559.script.js', '560.script.js', '561.script.js', '563.script.js', '564.script.js', '565.script.js', '566.script.js', '567.script.js', '568.script.js', '569.script.js', '570.script.js', '571.script.js', '572.script.js', '574.script.js', '575.script.js', '576.script.js', '577.script.js', '578.script.js', '579.script.js', '580.script.js', '581.script.js', '582.script.js', '583.script.js', '585.script.js', '586.script.js', '587.script.js', '588.script.js', '589.script.js', '590.script.js', '591.script.js', '592.script.js', '593.script.js', '594.script.js', '596.script.js', '597.script.js', '598.script.js', '599.script.js', '600.script.js', '601.script.js', '602.script.js'];

const rootTest = '../../node_modules/test262-parser-tests';
let x = 0;
readdirSync(`${rootTest}/pass`)
	.filter(f => !passExcludes.includes(f))
	.forEach(f => {
		// f = '08c3105bb3f7ccb7.js';
		console.log('parse `pass` file: ', f, ++x);
		let firstTree, secondTree;
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
		deepStrictEqual(firstTree, secondTree);
	});

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