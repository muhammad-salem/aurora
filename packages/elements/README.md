# Aurora Elements

Aurora elements, hold info about HTMLElements class, attributes and tag name.

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

const div = document.createElement('div');
console.log(hasNativeAttr(div, 'for'));

```

```ts
import { htmlParser } from '@ibyar/elements';

const template = `<div #div name="data-div" (click)="onDivClick($event)">
    				<person-view [name]="alex" age="35" @edit="onPersonViewClick($event)" />
				  </div>`;
const htmlNode = htmlParser.toDomRootNode(template)(template)
console.log(htmlNode);

```

