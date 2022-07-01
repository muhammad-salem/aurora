import { doesNotThrow, throws, deepStrictEqual } from 'assert';
import { readdirSync, readFileSync } from 'fs';
import { getLanguageMode, JavaScriptParser } from '@ibyar/expressions';

function parse(src, { isModule, earlyErrors }) {
	console.log('src:\n', src);
	const mode = getLanguageMode(isModule);
	return JavaScriptParser.parse(src, { mode, /* earlyErrors */ });
}


const runPassTest = true;
const runFailTest = false;
const runEarlyTest = false;

let passExcludes = [];
let passDeepExclude = [
	'b4bc5f201c297bca.module.js', '00b851b06af02cc0.js', '0339fa95c78c11bd.js',
	'0426f15dac46e92d.js', '06f0deb843fbf358.js', '06f7278423cef571.js',
	'070d82d1b3b3a975.js', '071f05b40ea0163f.js', '0813adc754c82a98.js',
	'0b1fc7208759253b.js', '0b4d61559ccce0f9.js', '0b6dfcd5427a43a6.js',
	'0c7719169ed21a87.js', '0f88c334715d2489.js', '0f9f10c894a7d811.js',
	'1093d98f5fc0758d.js', '110fa1efdd0868b8.js', '12e59b6d403833ae.js',
	'12ea3bf0653f8409.js', '1450a897a4ba83a7.js', '15a12468ff312d51.js',
	'15d9592709b947a0.js', '15dfd62aa10c8b18.js', '17326734a7bf9629.js',
	'17d63bb0b9482189.js', '17d881105a9a6c85.js', '1819ffb142e9c5ea.js',
	'1ca991b39b6e7754.js', '1cdce2d337e64b4f.js', '1e3f57c4ec83f5bc.js',
	'1e61843633dcb483.js', '1fbf374c8a04fb23.js', '209fc98bea7b9d67.js',
	'20aca21e32bf7772.js', '2179895ec5cc6276.js', '218e751b8b453b9b.js',
	'230da70c908c1859.js', '23869c020fc2cb0f.js', '242ede66951e11b1.js',
	'247a3a57e8176ebd.js', '25542e65ad9d2bf1.js', '25fd48ccc3bef96a.js',
	'264266c68369c672.js', '285648c16156804f.js', '2a7d131074016ba6.js',
	'2b9d4a632590814a.js', '2c4b264884006a8e.js', '2c5f4d039f9c7740.js',
	'2d10fed2af94fbd1.js', '2e371094f1b1ac51.js', '2e5fbf7b1685fa1b.js',
	'3097f73926c93640.js', '3098b57020860587.js', '30aee1020fc69090.js',
	'3156a92ca5319b8b.js', '317532451c2ce8ff.js', '323783be9a53a31e.js',
	'32b6854d07aefbda.js', '3315c524a740fe55.js', '3514acf61732f662.js',
	'373e35460ecaccc6.js', '3793ec99f844de1c.js', '37ac3bcee6fa89f9.js',
	'37d26e3bec6d9a0f.js', '3852fb3ffb8fd8d5.js', '3990bb94b19b1071.js',
	'3a1f039e533d1543.js', '3ae4f46daa688c58.js', '3b36d546985cd9cb.js',
	'3b9779d2e19376a1.js', '3d2ab39608730a47.js', '3df03e7e138b7760.js',
	'3e1a6f702041b599.js', '3e48826018d23c85.js', '3eb2c2bf585c0916.js',
	'3ee117e37bd3bcea.js', '3f46ee1db509d55d.js', '4014ec6c7931de54.js',
	'40766161d96ac708.js', '40adcdf7cfe3fa0d.js', '441a92357939904a.js',
	'45dd9586f26a3cf4.js', '47ea193a5fc3f2c7.js', '47f974d6fc52e3e4.js',
	'4a0d9236bc523b77.js', '4a56cf2dea99fcd6.js', '4a79205bd8cd49d0.js',
	'4b346e8c85a29408.js', '4c2a2b32f0470048.js', '4e07f8992cca7db0.js',
	'4e1a0da46ca45afe.js', '4f21a4e88694c0d8.js', '4f60d8fbb4be1120.js',
	'4fa08a62c2d8c495.js', '500804fd29695dac.js', '513275ce0e3c7ef3.js',
	'515825915b8d1cd8.js', '51b58dc84e1fab89.js', '54fb77cb2384a86b.js',
	'5526c98fdf9150c1.js', '55b74de671f60184.js', '56dcd0733a23aa26.js',
	'575306c08cc44b10.js', '57971b49e239c0ff.js', '5829d742ab805866.js',
	'589dc8ad3b9aa28f.js', '598a5cedba92154d.js', '599dff255c5ec792.js',
	'59ae0289778b80cd.js', '5a7812b78a03b937.js', '5b146261dda66d63.js',
	'5b683275df4548d1.js', '5bae374be95382c6.js', '5beffd72ddb47f13.js',
	'5c57eec29a019ebb.js', '5e0cab2e2e36274c.js', '61d8a7e497b6db72.js',
	'62541961bcef8d79.js', '627fede559e0bcac.js', '62d7c1ee4e1626c4.js',
	'664b0da1dd015106.js', '66aabbb5b00fb1ae.js', '68125aef6f5cc46f.js',
	'697b3d30c1d06918.js', '6a240463b40550d2.js', '6d1bf4c3db76b489.js',
	'6e5fe0c2bb20b016.js', '6edc155d463535cb.js', '7055b45fe7f74d94.js',
	'70c2ced6bad143f1.js', '70da848e355cdfd2.js', '717b2f65b69e809e.js',
	'71bcb4b846c22c58.js', '71e066a0fa01825b.js', '72d79750e81ef03d.js',
	'7305be27a0713dfa.js', '756579211447db0b.js', '756e3fe0ef87b136.js',
	'76a46be6c2f09fa3.js', '7788d3c1e1247da9.js', '779e65d6349f1616.js',
	'77a541b0502d0bde.js', '78435241f6c87ece.js', '7b72d7b43bedc895.js',
	'7c03e5eb6a9f6f1a.js', '7c6d13458e08e1f4.js', '7c9c0cce695bc705.js',
	'7d8b61ba2a3a275c.js', '7dab6e55461806c9.js', '7df2a606ecc6cd84.js',
	'7dfb625b91c5c879.js', '7e6e3b4c766a4d33.js', '7f88f149f16fe97a.js',
	'7fe89d8edf6e778a.js', '802658d6ef9a83ec.js', '80f60039028189e4.js',
	'81a0322e554af8da.js', '82a730bd109206bb.js', '82c827ccaecbe22b.js',
	'8386fbff927a9e0e.js', '84b2a5d834daee2f.js', '84f901eb37273117.js',
	'85263ecacc7a4dc5.js', '855b8dea36c841ed.js', '85d6723f13f33101.js',
	'87a9b0d1d80812cc.js', '88827d8021b5b3ab.js', '88c21621e3e8bba0.js',
	'892f6e09c02c35b5.js', '8c56cf12f007a392.js', '8c80f7ee04352eba.js',
	'8d6ab6352a3f7fa0.js', '8d7d59e5d573ca84.js', '8e3f0660b32fbfd2.js',
	'8ef08a335a7f5966.js', '8f8bfb27569ac008.js', '8fcaa7f3f8926a5e.js',
	'93108a695e5ff29d.js', '9349f48a456341b8.js', '9427da8abb4e7c67.js',
	'95520bedf0fdd4c9.js', '955c5fedb3931500.js', '95ab0d795c04ff38.js',
	'9681f5d844d7acd0.js', '96f5d93be9a54573.js', '988e362ed9ddcac5.js',
	'993584ec37388320.js', '9bcae7c7f00b4e3c.js', '9ec644dbf797e95c.js',
	'a11e875c4dd100af.js', 'a2042d86c592dd55.js', 'a5a01023fef4d506.js',
	'a5b30a03e9c774af.js', 'a62c6323a3696fa8.js', 'a7b8ce1d4c0f0bc2.js',
	'a8a03a88237c4e8f.js', 'a8b6c3139974f6e1.js', 'a8fea31fe6aa588e.js',
	'a953f09a1b6b6725.js', 'aaf1be6cd60a9ac9.js', 'ab452fc45813857a.js',
	'ab7ea8d738da7043.js', 'ad06370e34811a6a.js', 'ad0fd65944942eee.js',
	'afa63b136c835723.js', 'afffb6d317e53b92.js', 'b07c5fdc1003316b.js',
	'b0fdc038ee292aba.js', 'b1072e92becf06a9.js', 'b2e6c124e2822117.js',
	'b506e9cc13c4ad2e.js', 'b5cf21a87ec272d1.js', 'b5d302467c6f2f16.js',
	'b62c6dd890bef675.js', 'b6b5e49c97cedebb.js', 'b8ad1bd2ff50021f.js',
	'b9a4f9232146d4d9.js', 'ba620e120a809888.js', 'bd697f0fda948394.js',
	'be2fd5888f434cbd.js', 'be6eb70d9330c165.js', 'bf6aaaab7c143ca1.js',
	'bf9c4d8ecd728018.js', 'c1319833fc139cf8.js', 'c3172ad30aed99c8.js',
	'c3dc60d438666700.js', 'c4a57a72e25e042c.js', 'c52db35cba7fdbc0.js',
	'c5328483d3ccadd0.js', 'c7e5fba8bf3854cd.js', 'c8dbdecbde2c1869.js',
	'c963ac653b30699b.js', 'cb095c303f88cd0b.js', 'cb211fadccb029c7.js',
	'cb625ce2970fe52a.js', 'cd2f5476a739c80a.js', 'cdca52810bbe4532.js',
	'ce349e20cf388e87.js', 'ce569e89a005c02a.js', 'ce968fcdf3a1987c.js',
	'cf0eb6e6c4317c33.js', 'd038789ad15922ff.js', 'd2af344779cc1f26.js',
	'd2d8885e0c00ad51.js', 'd37653c5aedf3d46.js', 'd38771967621cb8e.js',
	'd57d9e2865e43807.js', 'd61d161a9c36fa45.js', 'd767138e133ad239.js',
	'd80edd7fb074b51d.js', 'd81d71f4121e3193.js', 'd95e9ad32d562722.js',
	'd97144839fbdca91.js', 'd9a0d4f0a35dc04e.js', 'db3c01738aaf0b92.js',
	'db66e1e8f3f1faef.js', 'dc3afa2f13259ae0.js', 'dc43022b3729abd1.js',
	'dd0e8f971ab4d6ab.js', 'ddcd0bf839779a45.js', 'df9c60e4ff82b9d9.js',
	'e0204155218e1d42.js', 'e0f831f2b08fd35c.js', 'e1387fe892984e2b.js',
	'e23748bdbb0713dc.js', 'e23f481ffc072aee.js', 'e290a32637ffdcb7.js',
	'e374d329af31c20a.js', 'e577d5b725159d71.js', 'e65f3cca9a4637c3.js',
	'e686d016100a7a08.js', 'e71c1d5f0b6b833c.js', 'e84ef669246313d2.js',
	'e8ea384458526db0.js', 'eb4b9e8905923468.js', 'ecba8fb326c2c985.js',
	'ed0783c35e43032b.js', 'ed65dd575be2b4ab.js', 'eda5026c194f7279.js',
	'f1218947a6a17e65.js', 'f1534392279bddbf.js', 'f15772354efa5ecf.js',
	'f2d394b74219a023.js', 'fb7c5656640f6ec7.js', 'fc286bf26373db8d.js',
	'fdb684acf63f6274.js', 'fe2d3b945530c806.js', 'fe5f0dcb8e902857.js',
	'fe7c2a6e1efe2cf4.js', 'fec4c4ff229d3fc2.js', 'ff03d6d14c3f4007.js',
	'ff215f966bed2b85.js',];
let failExcludes = [];
let earlyExcludes = [];

const errors = [];

const rootTest = './node_modules/test262-parser-tests';
let x = 0;
runPassTest && readdirSync(`${rootTest}/pass`)
	.filter(f => !passExcludes.includes(f))
	.forEach(f => {
		// f = '04b26d042948d474.js';
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
			if (passDeepExclude.includes(f)) {
				return;
			}
			const firstAST = JSON.stringify(firstTree, undefined, 2);
			const secondAST = JSON.stringify(secondTree, undefined, 2);
			console.log('firstTree', firstTree.toString(), firstAST);
			console.log('secondTree', secondTree.toString(), secondAST);
			deepStrictEqual(firstAST, secondAST);
			// deepStrictEqual(firstTree, secondTree);
		} catch (error) {
			// console.error('error', f, error);
			console.error('error', f, readFileSync(`${rootTest}/pass/${f}`, 'utf8'), readFileSync(`${rootTest}/pass-explicit/${f}`, 'utf8'));
			errors.push(f);
			// throw error;
		}
	});

runPassTest && printErrors(errors);

errors.splice(0);
x = 0;
runFailTest && readdirSync(`${rootTest}/fail`)
	.filter(f => !failExcludes.includes(f))
	.forEach(f => {
		// f = '3990bb94b19b1071.module.js';
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

runFailTest && printErrors(errors);

errors.splice(0);
x = 0;
runEarlyTest && readdirSync(`${rootTest}/early`)
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

runEarlyTest && printErrors(errors);

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