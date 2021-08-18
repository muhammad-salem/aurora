// let fs = require('fs');
// let path = require('path');
// let ProgressBar = require('progress');

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import ProgressBar from 'progress'; 'progress';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Paths
let rootPath = join(__dirname, '..');
let packagesPath = join(rootPath, 'packages');
let nodeModulesPath = join(rootPath, 'node_modules');
let docsPath = join(rootPath, 'docs');

// Packages
// let packages = collectPackages(packagesPath);
let mainPackageJson = JSON.parse(readFileSync(join(rootPath, 'package.json')));
let version = mainPackageJson.version;


// Commands
let commands = [
	'builddoc', // Build documents
];

function runNode(command, cwd, stdio) {
	execSync('node ' + command, {
		stdio: stdio || 'inherit',
		cwd,
	});
}

function buildDoc() {
	let config = {
		tsconfig: join(rootPath, 'tsconfig.json'),
		packages: rootPath,
		out: docsPath,
		name: '"Ibyar Aurora API Reference"',
		logger: 'none',
		exclude: '**/test/**/*.ts',
		excludeExternals: '',
		excludePrivate: '',
	};

	let cmd = join(
		nodeModulesPath,
		'typedoc/bin/typedoc'
	);
	for (let key of Object.keys(config)) {
		let value = config[key];
		cmd += ` --${key} ${value}`;
	}

	runNode(cmd, rootPath, 'pipe');
}



class Runner {
	constructor() {
		this.tasks = [];
	}

	addTask(callback, name) {
		this.tasks.push({
			callback: async () => {
				await callback();
			},
			name,
		});
	}

	run() {
		(async () => {
			console.log(`Start building ibyar aurora version ${version}\n`);

			let bar = new ProgressBar('[:bar] (:current/:total finished) :message  ', {
				total: this.tasks.length,
				width: 40,
				complete: '#',
			});

			for (let i = 0; i < this.tasks.length; i++) {
				let task = this.tasks[i];

				if (i == 0) {
					bar.tick(0, {
						message: task.name,
					});
				} else {
					bar.tick({
						message: task.name,
					});
				}

				await task.callback().catch(e => {
					throw e;
				});

				await new Promise(resolve => setTimeout(resolve, 100));
			}

			bar.tick({
				message: '',
			});
			console.log('\nBuild completed successfully.');
		})().catch(e => {
			console.error('\n');
			console.error(e);
			process.exit(1);
		});
	}
}

function buildAll(options) {
	let tasks = [
		{
			message: 'Building documents...',
			callback: buildDoc,
			enabled: options.builddoc,
		},
	];

	let runner = new Runner();
	tasks.filter(task => task.enabled).forEach(task => runner.addTask(task.callback, task.message));
	runner.run();
}

function parseOptions(additionalParams) {
	let params = [...process.argv, ...additionalParams];
	let options = {};
	for (let i = 0; i < params.length; i++) {
		let index = commands.indexOf(params[i]);

		if (index >= 0) {
			options[commands[index]] = true;
		}
	}
	return options;
}
// For debugging, put the build options below:
// e.g.
// let options = ['builddoc'];
let options = [];
buildAll(parseOptions(options));
