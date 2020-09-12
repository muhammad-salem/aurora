# Aurora Element

Aurora element, hold info about HTMLElements class, attributes and tag name.

## `Install`

``` bash
npm i --save @aurorats/element
```

``` bash
yarn add @aurorats/element
```


## Exmaple

```elementcripe
import { hasNativeAttr } from '@aurorats/element';

let div = document.createElement('div');
console.log(hasNativeAttr(div, 'for'));

```
