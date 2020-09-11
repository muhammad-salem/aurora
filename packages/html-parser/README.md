# Aurora HTML Parser

[![NPM Version][npm-image]][npm-url]
[![NPM Downloads][downloads-image]][downloads-url]
[![Install Size][badge-size]][badge-size]
[![LICENSE][license-img]][license-url]
![npm-dependencies][npm-dep-url]
[![lerna][lerna-img]][lerna-url]
![GitHub contributors][contributors]

[npm-image]: https://img.shields.io/npm/v/@aurorats/html-parser.svg
[npm-url]: https://npmjs.org/package/@aurorats/html-parser
[downloads-image]: https://img.shields.io/npm/dt/@aurorats/html-parser
[downloads-url]: https://npmjs.org/package/@aurorats/html-parser
[badge-size]: https://img.shields.io/bundlephobia/min/@aurorats/html-parser
[license-img]: https://img.shields.io/github/license/aurorats/aurora
[license-url]: https://github.com/aurorats/aurora/blob/master/LICENSE
[npm-dep-url]: https://img.shields.io/david/aurorats/aurora.svg?maxAge=2592000
[lerna-img]: https://img.shields.io/badge/maintained%20with-lerna-cc00ff.svg
[lerna-url]: https://lerna.js.org/
[contributors]: https://img.shields.io/github/contributors/aurorats/aurora

Aurora HTML parser, parse an html string or file to jsx component.

## `Install`

``` bash
npm i --save @aurorats/html-parser
```

``` bash
yarn add @aurorats/html-parser
```

## Example

```html-parsercripe
import { toJsxAttrComponent } from '@aurorats/html-parser';

let template = 
`<div name="data-div">
    <person-view [name]="alex" age="35" />
</div>`;
let jsxComponent = toJsxAttrComponent(template)
console.log(jsxComponent);

```
