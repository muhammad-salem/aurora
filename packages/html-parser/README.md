# Aurora HTML Parser

Aurora HTML parser, parse an html string or file to jsx component.

## `Install`

``` bash
npm i --save @ibyar/html-parser
```

``` bash
yarn add @ibyar/html-parser
```

## Example

```ts
import { toJsxAttrComponent } from '@ibyar/html-parser';

let template = 
`<div name="data-div">
    <person-view [name]="alex" age="35" />
</div>`;
let jsxComponent = toJsxAttrComponent(template)
console.log(jsxComponent);

```
