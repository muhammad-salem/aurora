# Aurora Expression

Aurora expression, an template expression evaluation.

## `Install`

``` bash
npm i --save @aurorats/expression
```

``` bash
yarn add @aurorats/expression
```


## Example
```ts
import { NodeExpression, parseJSExpression } from '@aurorats/expression';

let context:{[key: string]: any} = {
    a: 6,
    b: 4,

    g: {
        c: 7,
        d: 3
    }
};
let exp = `a + b === g.c + g.d`;

let expNode:NodeExpression = parseJSExpression(exp);

console.log(expNode.toString());
console.log(expNode.get(context));

exp = `c = a + g.d`;
expNode = parseJSExpression(exp);

console.log(expNode.get(context));
console.log(context.c);

```
