# Aurora Expression

Aurora expression, an template expression evaluation.

## `Install`

``` bash
npm i --save @ibyar/expression
```

``` bash
yarn add @ibyar/expression
```


## Example
```ts
import { NodeExpression, JavaScriptParser, ScopeProvider } from '@ibyar/expression';

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
