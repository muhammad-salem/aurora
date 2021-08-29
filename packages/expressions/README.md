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

Aurora expression, an template expression evaluation, with stack and scope.

 - this package has no dependance, can work on both (Node.js) and any Web Browsers, that support modules and class syntax

## `Install`

``` bash
npm i --save @ibyar/expressions
```

``` bash
yarn add @ibyar/expressions
```


## Example
```ts
import { JavaScriptParser, Scope, Stack } from '@ibyar/expressions';

const source = `
	let { x, y } = {x: 5, y: 55};
	const z = x / y;
	console.log({x, y, z});
	const alex = { firstName: 'alex', lastName: 'jon', age: 30 };
	alex.fullName = function(){ return this.firstName + ' ' + this.lastName;};
	console.log(alex.fullName());
	console.log(alex.fullName.toString());
	setTimeout(() => console.log('setTimeout', alex), 500);
	const sara = { firstName: 'sara', lastName: 'jon', age: 28, [Symbol.toStringTag]: 'SARA'};
	console.log(sara['age']);
	console.log('toStringTag', sara[Symbol.toStringTag]);
	console.log('compare', sara.age <=> alex.age);
	console.log('older', sara.age >? alex.age);
	console.log('younger', sara.age <? alex.age);
	console.log('typeof', typeof alex);
	console.log('typeof', typeof alex.age);
	console.log('regex 1', /regex/g.test('reg'));
	console.log('regex 2', /regex/g.test('regex'));
	`
	+
	'let stringLiteralExample = `${alex.firstName} and ${sara.firstName} are friends`; console.log({stringLiteralExample})';
const ast = JavaScriptParser.parse(source);
const esTree = ast.toJSON();
const esTreeString = JSON.stringify(ast, void 0, 2);
console.log({ esTree, esTreeString });
const context = {
	Promise,
	setTimeout,
	console,
	Symbol
};
const stack = Stack.for(context);
const globalScope = Scope.emptyFunctionScope();
stack.pushScope(globalScope);
ast.get(stack);
console.log(
	'from global context values: x: %s, y: %s',
	globalScope.getContext().x,
	globalScope.getContext().y
);
console.log(
	globalScope.getContext()
);

```

## follow ast of [estree](https://github.com/estree/estree/)

