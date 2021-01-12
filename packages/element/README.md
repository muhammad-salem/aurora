# Aurora Element

Aurora element, hold info about HTMLElements class, attributes and tag name.

## `Install`

``` bash
npm i --save @ibyar/element
```

``` bash
yarn add @ibyar/element
```


## Exmaple

```ts
import { hasNativeAttr } from '@ibyar/element';

let div = document.createElement('div');
console.log(hasNativeAttr(div, 'for'));

```
