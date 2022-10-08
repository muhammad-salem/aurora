# Ibyar Expression

[![NPM Version][npm-image]][npm-url]
[![NPM Downloads][downloads-image]][downloads-url]
[![LICENSE][license-img]][license-url]
[![lerna][lerna-img]][lerna-url]
![GitHub contributors][contributors]

[npm-image]: https://img.shields.io/npm/v/@ibyar/expressions.svg?logo=npm&logoColor=fff&label=NPM+package&color=limegreen
[npm-url]: https://npmjs.org/package/@ibyar/expressions
[downloads-image]: https://img.shields.io/npm/dt/@ibyar/expressions
[downloads-url]: https://npmjs.org/package/@ibyar/expressions
[license-img]: https://img.shields.io/github/license/ibyar/aurora
[license-url]: https://github.com/ibyar/aurora/blob/master/LICENSE
[lerna-img]: https://img.shields.io/badge/maintained%20with-lerna-cc00ff.svg
[lerna-url]: https://lerna.js.org/
[contributors]: https://img.shields.io/github/contributors/ibyar/aurora

		Your Mirror Dimension in the javascript world.

Ibyar expression, is a JavaScript expression parsing and evaluation. and template expression evaluation, with stack and scope.

 - this package has no dependance, can work on both (Node.js) and any Web Browsers, that support modules and class syntax
 - An 100% spec compliant ES2022 JavaScript toolchain

## `Install`

``` bash
npm i --save @ibyar/expressions
```

``` bash
yarn add @ibyar/expressions
```

## Try the parser
- Ibyar Expression parser: https://ibyar.github.io/astexplorer/


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
	console.log('toStringTag', Object.prototype.toString.call(sara));
	console.log('compare', sara.age <=> alex.age);
	console.log('older', sara.age >? alex.age);
	console.log('younger', sara.age <? alex.age);
	console.log('typeof', typeof alex);
	console.log('typeof', typeof alex.age);
	console.log('regex 1', /regex/g.test('reg'));
	console.log('regex 2', /regex/g.test('regex'));
	`
	+
	'let stringLiteralExample = `${alex.firstName} and ${sara.firstName} are friends`; console.log({stringLiteralExample});'
	+
	`
	function latex(str) {
		return { "cooked": str[0], "raw": str.raw[0] }
	}
	`
	+
	'let taggedStringLiteral = latex`Hi\n${2+3}!`; console.log({taggedStringLiteral});'
	;

const pipeSource = `
const add = (arg1, arg2) => arg1 + arg2;
a
	|> function(s) {return s;}
	|> (c => b = c + 1)
	|> add(?, 2)
	|> add(3, ?)
	|> console.log:4:5;`;

const ast = JavaScriptParser.parse(source + pipeSource);
const esTree = ast.toJSON();
const esTreeString = JSON.stringify(ast, void 0, 2);
console.log({ esTree, esTreeString });
const context = {
	Promise,
	setTimeout,
	console,
	Symbol,
	Object
};
const stack = Stack.for(context);
const globalScope = Scope.functionScopeFor({
	a: 7,
	b: undefined
});
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

## follow ast of [ESTree](https://github.com/estree/estree/)

### Feature

 - [V8 JavaScript engine](https://github.com/v8/v8) to parse js source code.
 - for now this parser does not provide any info about `SourceLocation`

## Future Feature

 - class expression
 - Import/Export module
 - Custom Factory Builder to convert the code to ESTree directly or to executable expression node

## Operators

| Operator type          | Individual operators                                    |
| ---------------------- | ------------------------------------------------------- |
| member                 | `. []`                                                  |
| call / create instance | `() new`                                                |
| negation/increment     | `! ~ - + ++ -- typeof void delete`                      |
| multiply/divide        | `* / % ** %%`                                           |
| addition/subtraction   | `+ -`                                                   |
| bitwise shift          | `<< >> >>>`                                             |
| relational             | `< <= > >= >? <? <=> in instanceof`                     |
| equality               | `== != === !==`                                         |
| bitwise-and            | `&`                                                     |
| bitwise-xor            | `^`                                                     |
| bitwise-or             | `\|`                                                    |
| logical-and            | `&&`                                                    |
| logical-or             | `\|\|`                                                  |
| conditional            | `?:`                                                    |
| pipeline               | `\|>`                                                  |
| assignment             | `= += -= *= **= /= %= <<= >>= >>>= &= ^= \|= &&= \|\|= ??= >?= <?= %%=` |
| comma                  | `,`                                                     |

non-ecma operator are `%% >? <? <=> >?= <?= %%=`


## Pipeline Operator |> Support

- support angular-like syntax and partial operator for a call syntax:

```js
x |> methodName1:arg2:arg3
  |> methodName2(arg1, ?, ...arg3);


function add(x, y, z) { return x + y + z };
const a = 88;
const b = 99;
const c  = 11;
const z =  a |> add:b:c; // === add(a, b, c)
```

```js
function map(num){
	return { number: num };
}
function plus(num1){
	return function(num2){
		return num1 + num2;
	};
}
function add(x, y) { return x + y };
const a = 88, b = 11;
b 	|> function(x) { console.log(x); return x; }
	|> x => { console.log(x); return x; }
	|> (x => x + 10)
	|> plus(a)
	|> add(99, ?)
	|> add : 88 : ?
	|> add : ? : 77
	|> map
```


### How to use stack and scope:

 1- create stack:

 ```ts
 import { Scope, Stack } from '@ibyar/expressions';

const stack1 = new Stack();

// OR

const scope1 = new Scope<{x: number, y: number}>( {x: 8, y: 6});
const scope2 = Scope.for({z: 9});

const stack2 = new Stack([scope1, scope2]);

 ```

  2- any of the previous stacks, does not provide and public api like `Math`, `String`, ....
  you need to provide these values to the stack, the stack work as a sandbox, isolated from the js-VM.

```ts
import { ReadOnlyScope } from '@ibyar/expressions';

stack1.pushScope(ReadOnlyScope.for({
	Math: {
		E: Math.E,
		LN10: Math.LN10,
		LN2: Math.LN2,
		LOG10E: Math.LOG10E,
		LOG2E: Math.LOG2E,
		PI: Math.PI,
		SQRT1_2: Math.SQRT1_2,
		SQRT2: Math.SQRT2,

		abs: Math.abs,
		acos: Math.acos,
		asin: Math.asin,
		atan: Math.atan,
		atan2: Math.atan2,
		ceil: Math.ceil,
		....
	},
	// or 
	Math,
	// another object
	Array: {
		// in js a statement like `let x = new Array()` will throw exception.
		isArray: Array.isArray,
	},

	Array, // `let x = new Array()` no Error.


	parseFloat,
	parseInt,
	String,
	console,
}));
```
	so now you can write js code the use these as identifier



 3- the stack is ready to use with expression
 4- try to parse an expression like `let x = 'data'; console.log(x);`.
 
```ts
import { JavaScriptParser } from '@ibyar/expressions';

const ast = JavaScriptParser.parse(`let x = 'data'; console.log(x);`);

// use get method to execute an expression and return a value if available.

ast.get(stack1);
// it should print 'data' on the console
```


 5- you can visit the ast 

```ts
import { expressionVisitor, VariableDeclaration } from '@ibyar/expressions';

expressionVisitor.visit(ast, (expression, type, control) => {
	if (type === 'VariableDeclaration') {
		const kind = (expression as VariableDeclaration).getKind();
		
		....
	}
});

```