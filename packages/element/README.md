# Aurora Element

[![NPM Version][npm-image]][npm-url]
[![NPM Downloads][downloads-image]][downloads-url]
[![Install Size][badge-size]][badge-size]
[![LICENSE][license-img]][license-url]
![npm-dependencies][npm-dep-url]
[![lerna][lerna-img]][lerna-url]

[npm-image]: https://img.shields.io/npm/v/@aurorats/element.svg
[npm-url]: https://npmjs.org/package/@aurorats/element
[downloads-image]: https://img.shields.io/npm/dm/@aurorats/element.svg
[downloads-url]: https://npmjs.org/package/@aurorats/element
[badge-size]: https://packagephobia.now.sh/badge?p=@aurorats/element
[license-img]: https://img.shields.io/github/license/ts-aurora/aurora
[license-url]: https://github.com/ts-aurora/aurora/blob/master/LICENSE
[npm-dep-url]: https://img.shields.io/david/ts-aurora/aurora.svg?maxAge=2592000
[lerna-img]: https://img.shields.io/badge/maintained%20with-lerna-cc00ff.svg
[lerna-url]: https://lerna.js.org/

Aurora element, hold informatiom about HTMLElements class and thier attributes and tag names.

## `Install`

``` bash
npm i --save @aurorats/element
```

``` bash
yarn add @aurorats/element
```


## Exmaple

```typescripe
import { hasNativeAttr } from '@aurorats/element';

let div = document.createElement('div');
console.log(hasNativeAttr(div, 'for'));

```
