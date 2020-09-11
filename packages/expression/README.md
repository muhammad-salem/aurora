# Aurora Expression

[![NPM Version][npm-image]][npm-url]
[![NPM Downloads][downloads-image]][downloads-url]
[![Install Size][badge-size]][badge-size]
[![LICENSE][license-img]][license-url]
![npm-dependencies][npm-dep-url]
[![lerna][lerna-img]][lerna-url]
![GitHub contributors][contributors]

[npm-image]: https://img.shields.io/npm/v/@aurorats/expression.svg
[npm-url]: https://npmjs.org/package/@aurorats/expression
[downloads-image]: https://img.shields.io/npm/dt/@aurorats/expression
[downloads-url]: https://npmjs.org/package/@aurorats/expression
[badge-size]: https://img.shields.io/bundlephobia/min/@aurorats/expression
[license-img]: https://img.shields.io/github/license/aurorats/aurora
[license-url]: https://github.com/aurorats/aurora/blob/master/LICENSE
[npm-dep-url]: https://img.shields.io/david/aurorats/aurora.svg?maxAge=2592000
[lerna-img]: https://img.shields.io/badge/maintained%20with-lerna-cc00ff.svg
[lerna-url]: https://lerna.js.org/
[contributors]: https://img.shields.io/github/contributors/aurorats/aurora

Aurora expression, an template expression evaluation.

## `Install`

``` bash
npm i --save @aurorats/expression
```

``` bash
yarn add @aurorats/expression
```


## Exmaple
```expressioncripe
import { NodeExpression, parseHtmlExpression } from '@aurorats/expression';

let context:{[key: string]: any} = {
    a: 6,
    b: 4,

    g: {
        c: 7,
        d: 3
    }
};
let exp = `a + b === g.c + g.d`;

let expNode:NodeExpression = parseHtmlExpression(exp);

console.log(expNode.toString());
console.log(expNode.get(context));

exp = `c = a + g.d`;
expNode = parseHtmlExpression(exp);

console.log(expNode.get(context));
console.log(context.c);

```
