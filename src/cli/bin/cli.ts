#!/usr/bin/env node


if (process.argv.includes('-b') || process.argv.includes('--build')) {
	import('../compiler/compile.js').then(module => module.compileArgs());
}
