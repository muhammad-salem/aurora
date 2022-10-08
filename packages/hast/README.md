# Ibyar hast

[![NPM Version][npm-image]][npm-url]
[![NPM Downloads][downloads-image]][downloads-url]
[![LICENSE][license-img]][license-url]
[![lerna][lerna-img]][lerna-url]
![GitHub contributors][contributors]

[npm-image]: https://img.shields.io/npm/v/@ibyar/elements.svg?logo=npm&logoColor=fff&label=NPM+package&color=limegreen
[npm-url]: https://npmjs.org/package/@ibyar/elements
[downloads-image]: https://img.shields.io/npm/dt/@ibyar/elements
[downloads-url]: https://npmjs.org/package/@ibyar/elements
[license-img]: https://img.shields.io/github/license/ibyar/aurora
[license-url]: https://github.com/ibyar/aurora/blob/master/LICENSE
[lerna-img]: https://img.shields.io/badge/maintained%20with-lerna-cc00ff.svg
[lerna-url]: https://lerna.js.org/
[contributors]: https://img.shields.io/github/contributors/ibyar/aurora

Ibyar hast, HTML parser and serializer.

## `Install`

``` bash
npm i --save @ibyar/hast
```

``` bash
yarn add @ibyar/hast
```

## Try the parser
- Ibyar hast parser: https://ibyar.github.io/astexplorer/


## Example

```ts
import { htmlParser } from '@ibyar/hast';

const template = `<div #div name="data-div" (click)="onDivClick($event)">
    				<person-view [name]="alex" age="35" @edit="onPersonViewClick($event)" />
				  </div>`;
const htmlNode = htmlParser.toDomRootNode(template)(template)
console.log(htmlNode);

```
