# Ibyar CLI

[![NPM Version][npm-image]][npm-url]
[![NPM Downloads][downloads-image]][downloads-url]
[![LICENSE][license-img]][license-url]
[![lerna][lerna-img]][lerna-url]
![GitHub contributors][contributors]

[npm-image]: https://img.shields.io/npm/v/@ibyar/cli.svg?logo=npm&logoColor=fff&label=NPM+package&color=limegreen
[npm-url]: https://npmjs.org/package/@ibyar/cli
[downloads-image]: https://img.shields.io/npm/dt/@ibyar/cli
[downloads-url]: https://npmjs.org/package/@ibyar/cli
[license-img]: https://img.shields.io/github/license/ibyar/aurora
[license-url]: https://github.com/ibyar/aurora/blob/master/LICENSE
[lerna-img]: https://img.shields.io/badge/maintained%20with-lerna-cc00ff.svg
[lerna-url]: https://lerna.js.org/
[contributors]: https://img.shields.io/github/contributors/ibyar/aurora

The Ibyar/Aurora CLI tool. ( dev - prerelease)


## `Install`

``` bash
npm i -g --save @ibyar/cli
```

``` bash
yarn global add @ibyar/cli
```

# How to use

 `npx ibyar --build --watch --verbose`

 it load the configuration from a `tsconfig.json` file

```
Usage: ibyar [options]

Examples:
    ibyar
    ibyar -b				# run build
    ibyar -b -w				# run build and watch
    ibyar -b -v -w			# run build, show tsc logs and watch
    ibyar -v				# show cli version
    ibyar --help

Options:
    -b      --build             compile the project source code with ibyar transformers
	                            and generate '.d.ts' files with created Custom HTML Element definitions.
    -w		--watch				compile and watch source files, used with --build
    -h      --help              print help message
    -v      --version           output the version number
```



## Integration with `Webpack`


### add @ibyar/cli as loader

```js
module.exports = {
  entry: './src/index.ts',
    module: {
      exprContextCritical: false,
        rules: [
          {
            test: /\.tsx?$/,
            use: ['@ibyar/cli',],
            exclude: /node_modules/,
          }
        ]
      }
};
```

### use `ts-loader`

```js
// 1. import default from the plugin module
import {
	beforeCompileDirectiveOptions, beforeCompileComponentOptions,
	afterDeclarationsCompileComponentOptions,
	afterDeclarationsCompileDirectiveOptions,
	scanDirectivesOnceAsTransformer,
} from '@ibyar/cli';


// 3. add getCustomTransformer method to the loader config
var config = {
    ...
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                loader: 'ts-loader',
                options: {
                    ... // other loader's options
                    getCustomTransformers: () => ({
						before: [
							scanDirectivesOnceAsTransformer(),
							beforeCompileDirectiveOptions,
							beforeCompileComponentOptions,
						],
						after: [],
						afterDeclarations: [
							afterDeclarationsCompileComponentOptions,
							afterDeclarationsCompileDirectiveOptions,
						],
					})
                }
            }
        ]
    }
    ...
};
```

## Integration with `Rollup`


```js
import typescript from '@rollup/plugin-typescript';
import {
	beforeCompileDirectiveOptions, beforeCompileComponentOptions,
	afterDeclarationsCompileComponentOptions,
	afterDeclarationsCompileDirectiveOptions,
	scanDirectivesOnceAsTransformer,
} from '@ibyar/cli';

export default = {
	...,
	plugins: [
		typescript({
			transformers: {
				before: [
					{ type: 'program', factory: scanDirectivesOnceAsTransformer() },
					{ type: 'program', factory: beforeCompileDirectiveOptions },
					{ type: 'program', factory: beforeCompileComponentOptions },
				],
				after: [],
				afterDeclarations: [
					{ type: 'program', factory: afterDeclarationsCompileComponentOptions },
					{ type: 'program', factory: afterDeclarationsCompileDirectiveOptions },
				],
			}
		}),
	],
};

```



The Ibyar CLI has a typescript transformer to generate a definitions for you component

```ts
import { Component, EventEmitter, Input, output } from '@ibyar/aurora';


@Component({
	selector: 'person-edit',
	template: `<form #form>
					<input if="show" type="text" [(value)]="person.name" />
					<input type="number" [(value)]="person.age" />
					<input type="button" (click)="printPerson()" value="Save" />
				</form>`
})
export class PersonEdit {

	person = input<Person>();

	show = input(true);

	save = output<Person>();

	printPerson() {
		console.log(this.person.get());
		this.save.emit(this.person.get());
	}
}

```

will generate the view class and add it to the definition files 

```ts
import { EventEmitter } from '@ibyar/aurora';

export declare class PersonEdit {
    static readonly HTMLPersonEditElement: ConstructorOfView<HTMLPersonEditElement>;
    person: Person;
    show: boolean;
    save: EventEmitter<Person>;
    printPerson(): void;
}

import { BaseComponent, ConstructorOfView } from "@ibyar/core";

declare class HTMLPersonEditElement extends HTMLElement {
    public static observedAttributes: ('person' | 'show' | 'onSave')[];
    public person: Person;
    public show: true;
    public onSave: EventEmitter<Person>;
}

declare interface HTMLPersonEditElement extends BaseComponent<PersonEdit> {}

declare global {
    interface HTMLElementTagNameMap {
        ["person-edit"]: HTMLPersonEditElement;
    }
}


```
