#!/usr/bin/env node


if (process.argv.includes('-b') || process.argv.includes('--build')) {
	import('../compiler/compile.js').then(module => {
		if (process.argv.includes('-w') || process.argv.includes('--watch')) {
			module.compileAndWatchArgs();
		} else {
			module.compileArgs();
		}
	});
}
