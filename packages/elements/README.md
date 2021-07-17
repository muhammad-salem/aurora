# Aurora Elements

[![NPM Version][npm-image]][npm-url]
[![NPM Downloads][downloads-image]][downloads-url]
[![LICENSE][license-img]][license-url]
![npm-dependencies][npm-dep-url]
[![lerna][lerna-img]][lerna-url]
![GitHub contributors][contributors]

[npm-image]: https://img.shields.io/npm/v/@ibyar/elements.svg
[npm-url]: https://npmjs.org/package/@ibyar/elements
[downloads-image]: https://img.shields.io/npm/dt/@ibyar/elements
[downloads-url]: https://npmjs.org/package/@ibyar/elements
[license-img]: https://img.shields.io/github/license/ibyar/aurora
[license-url]: https://github.com/ibyar/aurora/blob/master/LICENSE
[npm-dep-url]: https://img.shields.io/david/ibyar/elements.svg?maxAge=2592000
[lerna-img]: https://img.shields.io/badge/maintained%20with-lerna-cc00ff.svg
[lerna-url]: https://lerna.js.org/
[contributors]: https://img.shields.io/github/contributors/ibyar/aurora

Aurora elements, hold info about HTMLElements class, attributes and tag name.

## `Install`

``` bash
npm i --save @ibyar/elements
```

``` bash
yarn add @ibyar/elements
```


## Example

```ts
import { hasNativeAttr } from '@ibyar/elements';

const div = document.createElement('div');
console.log(hasNativeAttr(div, 'for'));

```

```ts
import { htmlParser } from '@ibyar/elements';

const template = `<div #div name="data-div" (click)="onDivClick($event)">
    				<person-view [name]="alex" age="35" @edit="onPersonViewClick($event)" />
				  </div>`;
const htmlNode = htmlParser.toDomRootNode(template)(template)
console.log(htmlNode);

```

