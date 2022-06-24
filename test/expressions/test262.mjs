import { doesNotThrow, throws, deepStrictEqual } from 'assert';
import { readdirSync, readFileSync } from 'fs';
import { getLanguageMode, JavaScriptParser } from '@ibyar/expressions';

function parse(src, { isModule, earlyErrors }) {
	console.log('src:\n', src);
	const mode = getLanguageMode(isModule);
	JavaScriptParser.parse(src, { mode, /* earlyErrors */ });
	// return JavaScriptParser.parse(src, { mode: getLanguageMode(isModule), /* earlyErrors */ });
}


let passExcludes = [
	'1a7800a74a866638.js', '29e41f46ede71f11.js', '2aa1db78027ba395.js',
	'31ad88cae27258b7.js', '3990bb94b19b1071.js', '3ae4f46daa688c58.js',
	'3d2ab39608730a47.js', '3e48826018d23c85.js', '4672c2ef688237c9.js',
	'4789c3375f112cd4.js', '4f5419fe648c691b.js', '4fee4ac53bdfd7f7.js',
	'54e70df597a4f9a3.js', '569a2c1bad3beeb2.js', '56fd564979894636.js',
	'598a5cedba92154d.js', '5a2a8e992fa4fe37.js', '5b39aca97d9006f4.js',
	'5beffd72ddb47f13.js', '5d5b9de6d9b95f3e.js', '6196b3f969486455.js',
	'714be6d28082eaa7.js', '71e066a0fa01825b.js', '77db52b103913973.js',
	'7b514406528ff126.js', '7c03e5eb6a9f6f1a.js', '84f901eb37273117.js',
	'8e3f0660b32fbfd2.js', '8ec6a55806087669.js', '9027dae72a91a9ed.js',
	'925443c6cf79aa88.js', '946bee37652a31fa.js', '94cb828d5dcfd136.js',
	'96941f16c2d7cec4.js', '9aa93e1e417ce8e3.js', '9ec644dbf797e95c.js',
	'9f0d8eb6f7ab8180.js', '9fe1d41db318afba.js', 'ad06370e34811a6a.js',
	'affd557fd820e1f2.js', 'afffb6d317e53b92.js', 'b376d3924d77aa8a.js',
	'b5cf21a87ec272d1.js', 'ba00173ff473e7da.js', 'bb41f0778f00f131.js',
	'c412905e229d6f2b.js', 'c532e126a986c1d4.js', 'c83a2dcf75fa419a.js',
	'c8b9a4d186ec2eb8.js', 'ce0aaec02d5d4465.js', 'd79a08ea5cc1e2f6.js',
	'dc3afa2f13259ae0.js', 'dec1ae80150e1664.js', 'e03ae54743348d7d.js',
	'e08e181172bad2b1.js', 'e5570b178254bfb9.js', 'eed97872dd924560.js',
	'fa5b398eeef697a6.js', 'fa736f4b0cf19c0c.js',
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
		// f = '1a7800a74a866638.js';
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
			deepStrictEqual(firstTree, secondTree);
		} catch (error) {
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