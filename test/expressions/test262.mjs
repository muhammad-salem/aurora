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
	'0c7719169ed21a87.js',
	'0e3ca454ddfb4729.js', '0f9f10c894a7d811.js', '110fa1efdd0868b8.js',
	'1270d541e0fd6af8.js', '14199f22a45c7e30.js', '17302b9b0cab0c69.module.js',
	'18cc9a6b7038070f.js', '1a7800a74a866638.js', '1d3dd296a717e478.js',
	'2418fddf06e515f8.js', '29e41f46ede71f11.js', '2bd8ae9202baa31e.js',
	'2dc1c08d0bff6eba.js', '31ad88cae27258b7.js', '332f0bc46d28db25.js',
	'3990bb94b19b1071.js', '3ae4f46daa688c58.js', '3b36d546985cd9cb.js',
	'3d2ab39608730a47.js', '3e48826018d23c85.js', '45ff445d87e37214.js',
	'4672c2ef688237c9.js', '4ae32442eef8a4e0.js', '4f5419fe648c691b.js',
	'4fee4ac53bdfd7f7.js', '54e70df597a4f9a3.js', '569a2c1bad3beeb2.js',
	'56fd564979894636.js', '585b857c11763bad.js', '5a2a8e992fa4fe37.js',
	'5b39aca97d9006f4.js', '5beffd72ddb47f13.js', '5d5b9de6d9b95f3e.js',
	'5dd65055dace49bc.js', '6196b3f969486455.js', '641ac9060a206183.js',
	'65401ed8dc152370.js', '6a220df693ce521c.js', '6d8728cbc7bfe6b5.js',
	'71e066a0fa01825b.js', '77a541b0502d0bde.js', '77db52b103913973.js',
	'7b514406528ff126.js', '7c03e5eb6a9f6f1a.js', '84eaae502ca93891.js',
	'84f901eb37273117.js', '8c80f7ee04352eba.js', '8d8913ebd8403c6a.js',
	'8e3f0660b32fbfd2.js', '8e609bb71c20b858.module.js', '8e6c915d1746636d.js',
	'8ec6a55806087669.js', '925443c6cf79aa88.js', '92a997b1ba17876e.js',
	'946bee37652a31fa.js', '94cb828d5dcfd136.js', '9aa93e1e417ce8e3.js',
	'9ec644dbf797e95c.js', '9f0d8eb6f7ab8180.js', '9fe1d41db318afba.js',
	'a022debc42a58f0c.js', 'a62c6323a3696fa8.js', 'ac6bbe8465f70ebd.module.js',
	'affd557fd820e1f2.js', 'afffb6d317e53b92.js', 'b0c6752e1db068ed.js',
	'b15ab152f8531a9f.js', 'b376d3924d77aa8a.js', 'b5cf21a87ec272d1.js',
	'ba00173ff473e7da.js', 'bb41f0778f00f131.js', 'be9d538d5041fd5f.js',
	'c412905e229d6f2b.js', 'c532e126a986c1d4.js', 'c546a199e87abaad.js',
	'c83a2dcf75fa419a.js', 'c8b9a4d186ec2eb8.js', 'ca7a0ca0d22f30f8.js',
	'ccd1f89a0344e04e.js', 'cd2f5476a739c80a.js', 'ce0aaec02d5d4465.js',
	'd1eafbc6bda219a7.js', 'd3ac25ddc7ba9779.js', 'd79a08ea5cc1e2f6.js',
	'd97144839fbdca91.js', 'da3756d1f8acb3c5.js', 'dc3afa2f13259ae0.js',
	'dec1ae80150e1664.js', 'e03ae54743348d7d.js', 'e08e181172bad2b1.js',
	'e2470430b235b9bb.module.js', 'e349023df8e12f2d.js', 'e4bd395227b4ee8e.js',
	'e5570b178254bfb9.js', 'e686d016100a7a08.js', 'eed97872dd924560.js',
	'f0d9a7a2f5d42210.js', 'f1bf02f18fa71ba7.js', 'f4b2d8937ec13ab0.js',
	'f8d843a30c73377a.js', 'fa5b398eeef697a6.js', 'fa736f4b0cf19c0c.js',
	'fbacebe72fb15fed.module.js', 'fbcd793ec7c82779.js', 'fe24fc72de1ef7cc.js'
];

let failExcludes = [];
let earlyExcludes = ['557.script.js', '558.script.js', '559.script.js', '560.script.js', '561.script.js', '563.script.js', '564.script.js', '565.script.js', '566.script.js', '567.script.js', '568.script.js', '569.script.js', '570.script.js', '571.script.js', '572.script.js', '574.script.js', '575.script.js', '576.script.js', '577.script.js', '578.script.js', '579.script.js', '580.script.js', '581.script.js', '582.script.js', '583.script.js', '585.script.js', '586.script.js', '587.script.js', '588.script.js', '589.script.js', '590.script.js', '591.script.js', '592.script.js', '593.script.js', '594.script.js', '596.script.js', '597.script.js', '598.script.js', '599.script.js', '600.script.js', '601.script.js', '602.script.js'];
earlyExcludes = [];

const errors = [];

const rootTest = '../../node_modules/test262-parser-tests';
let x = 0;
readdirSync(`${rootTest}/pass`)
	// .filter(f => !passExcludes.includes(f))
	.forEach(f => {
		// f = '402e8d30db64e5af.js';
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
		}
	});

const errorString = errors.map(JSON.stringify).map(s => s.replace(/"/g, "'")).map((s, i) => i % 3 ? s + ',' : `${s},\n`).join('');
console.log('pass errors', `[\n${errorString}]`);

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