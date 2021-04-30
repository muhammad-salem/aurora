# Aurora Elements

Aurora element, hold info about HTMLElements class, attributes and tag name.

## `Install`

``` bash
npm i --save @ibyar/elements
```

``` bash
yarn add @ibyar/elements
```


## Example

```ts
import { hasNativeAttr } from '@ibyar/elements';

let div = document.createElement('div');
console.log(hasNativeAttr(div, 'for'));

```

```ts
import { toJsxAttrComponent } from '@ibyar/elements';

let template = 
`<div name="data-div">
    <person-view [name]="alex" age="35" />
</div>`;
let jsxComponent = toJsxAttrComponent(template)
console.log(jsxComponent);

```

