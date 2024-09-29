# Ibyar Elements

[![NPM Version][npm-image]][npm-url]
[![NPM Downloads][downloads-image]][downloads-url]
[![LICENSE][license-img]][license-url]
[![lerna][lerna-img]][lerna-url]
![GitHub contributors][contributors]

[npm-image]: https://img.shields.io/npm/v/@ibyar/elements.svg?logo=npm&logoColor=fff&label=NPM+package&color=limegreen
[npm-url]: https://npmjs.org/package/@ibyar/elements
[downloads-image]: https://img.shields.io/npm/dt/@ibyar/elements
[downloads-url]: https://npmjs.org/package/@ibyar/elements
[license-img]: https://img.shields.io/github/license/ibyar/aurora
[license-url]: https://github.com/ibyar/aurora/blob/master/LICENSE
[lerna-img]: https://img.shields.io/badge/maintained%20with-lerna-cc00ff.svg
[lerna-url]: https://lerna.js.org/
[contributors]: https://img.shields.io/github/contributors/ibyar/aurora

Ibyar elements, hold info about HTMLElements class, attributes and tag name.

## `Install`

``` bash
npm i --save @ibyar/elements
```

``` bash
yarn add @ibyar/elements
```

## Try the parser
- Ibyar Elements parser: https://ibyar.github.io/astexplorer/


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

`By default the parser has no registered info about structural/attributes directive.`

You need to register them with inputs and outputs.

```ts
import { directiveRegistry } from '@ibyar/elements';


/**
 * register a structural directive, with name '*notifier' , the name must start with '*'.
 * with inputs `message` and `color`,
 * and output `action`.
 */ 
directiveRegistry.register('*notifier', {
	inputs: ['message', 'color'],
	outputs: ['action'],
});

/**
 *  register an attributes directive with name 'appConfirm'
 */
directiveRegistry.register('appConfirm', {
	inputs: [],
	outputs: [],
});

```

### note:

the attributes directive has higher priority than regular element attributes,
so if you registered an attributes directive with a name like 'style', 'class', 'id', 'name', etc... 
it will interpreted as an attributes directive and will be remove from the element attributes list.

```ts
import { directiveRegistry } from '@ibyar/elements';


/**
 * register an attributes directive with no input and no output.
 */
directiveRegistry.register('style');

```

## supported syntax for directives

```html
<!-- short hand -->
<div *for="let user of users"></div>
<div *if="user.name == 'ali'"></div>

<!-- full description -->
<div *for let-user [of]="users"></div>
<div *if [if]="user.name == 'ali'"></div>

<!-- tag name as directive -->
<for let-user [of]="user">....</for>
<if [if]="user.name == 'ali'">....</if>

<!-- control flow syntax -->

@if (a > b) {
  <p>{{a}} is greater than {{b}}</p>
}

@if (a > b) {
  {{a}} is greater than {{b}}
} @else if (b > a) {
  {{a}} is less than {{b}}
} @else {
  {{a}} is equal to {{b}}
}

@for (item of items; track item.id) {
  {{ item.name }}
}

@for (item of items; track item.name) {
  <li> {{ item.name }}</li>
} @empty {
  <li aria-hidden="true"> There are no items. </li>
}


@switch (userPermissions) {
  @case ('admin') {
    <app-admin-dashboard />
  }
  @case ('reviewer') {
    <app-reviewer-dashboard />
  }
  @case ('editor') {
    <app-editor-dashboard />
  }
  @default {
    <app-viewer-dashboard />
  }
}


<!-- Local template variables -->
		
@let name = user.name;
@let name = user.name, age = user.age; <!-- comma separated variable declaration -->
@let greeting = 'Hello, ' + name;
@let data = data$ | async;
@let pi = 3.1459;
@let coordinates = {x: 50, y: 100};
@let longExpression = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit ' +
                      'sed do eiusmod tempor incididunt ut labore et dolore magna ' +
                      'Ut enim ad minim veniam...';

```
