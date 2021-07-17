# Aurora Expression

[![NPM Version][npm-image]][npm-url]
[![NPM Downloads][downloads-image]][downloads-url]
[![LICENSE][license-img]][license-url]
![npm-dependencies][npm-dep-url]
[![lerna][lerna-img]][lerna-url]
![GitHub contributors][contributors]

[npm-image]: https://img.shields.io/npm/v/@ibyar/expressions.svg
[npm-url]: https://npmjs.org/package/@ibyar/expressions
[downloads-image]: https://img.shields.io/npm/dt/@ibyar/expressions
[downloads-url]: https://npmjs.org/package/@ibyar/expressions
[license-img]: https://img.shields.io/github/license/ibyar/aurora
[license-url]: https://github.com/ibyar/aurora/blob/master/LICENSE
[npm-dep-url]: https://img.shields.io/david/ibyar/expressions.svg?maxAge=2592000
[lerna-img]: https://img.shields.io/badge/maintained%20with-lerna-cc00ff.svg
[lerna-url]: https://lerna.js.org/
[contributors]: https://img.shields.io/github/contributors/ibyar/aurora

Aurora expression, an template expression evaluation.

## `Install`

``` bash
npm i --save @ibyar/expressions
```

``` bash
yarn add @ibyar/expressions
```


## Example
```ts
import { NodeExpression, JavaScriptParser, ScopeProvider } from '@ibyar/expressions';

const context:{[key: string]: any} = {
    a: 6,
    b: 4,

    g: {
        c: 7,
        d: 3
    }
};

const stack = ScopeProvider.for(context);

let expressionStr = `a + b === g.c + g.d`;

let expression:NodeExpression = JavaScriptParser.parse(expressionStr);

console.log(expression.toString());
console.log(expression.get(stack));

exp = `c = a + g.d`;
expNode = parseJSExpression(exp);
expression.get(stack);
console.log(context.c);

```
