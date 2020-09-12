# Aurora HTML Parser

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
