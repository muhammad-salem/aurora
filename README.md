# Aurora

[![NPM Version][npm-image]][npm-url]
[![NPM Downloads][downloads-image]][downloads-url]
[![LICENSE][license-img]][license-url]
[![lerna][lerna-img]][lerna-url]
![GitHub contributors][contributors]

[npm-image]: https://img.shields.io/npm/v/@ibyar/aurora.svg?logo=npm&logoColor=fff&label=NPM+package&color=limegreen
[npm-url]: https://npmjs.org/package/@ibyar/aurora
[downloads-image]: https://img.shields.io/npm/dt/@ibyar/aurora
[downloads-url]: https://npmjs.org/package/@ibyar/aurora
[license-img]: https://img.shields.io/github/license/ibyar/aurora
[license-url]: https://github.com/ibyar/aurora/blob/master/LICENSE
[lerna-img]: https://img.shields.io/badge/maintained%20with-lerna-cc00ff.svg
[lerna-url]: https://lerna.js.org/
[contributors]: https://img.shields.io/github/contributors/ibyar/aurora
[npm-image-pipes]: https://img.shields.io/npm/v/@ibyar/pipes.svg?logo=npm&logoColor=fff&label=NPM+package&color=limegreen
[npm-url-pipes]: https://npmjs.org/package/@ibyar/pipes
[npm-image-directives]: https://img.shields.io/npm/v/@ibyar/directives.svg?logo=npm&logoColor=fff&label=NPM+package&color=limegreen
[npm-url-directives]: https://npmjs.org/package/@ibyar/directives
[npm-image-core]: https://img.shields.io/npm/v/@ibyar/core.svg?logo=npm&logoColor=fff&label=NPM+package&color=limegreen
[npm-url-core]: https://npmjs.org/package/@ibyar/core
[npm-image-expressions]: https://img.shields.io/npm/v/@ibyar/expressions.svg?logo=npm&logoColor=fff&label=NPM+package&color=limegreen
[npm-url-expressions]: https://npmjs.org/package/@ibyar/expressions
[npm-image-elements]: https://img.shields.io/npm/v/@ibyar/elements.svg?logo=npm&logoColor=fff&label=NPM+package&color=limegreen
[npm-url-elements]: https://npmjs.org/package/@ibyar/elements
[npm-image-platform]: https://img.shields.io/npm/v/@ibyar/platform.svg?logo=npm&logoColor=fff&label=NPM+package&color=limegreen
[npm-url-platform]: https://npmjs.org/package/@ibyar/platform
[npm-image-reflect-metadata]: https://img.shields.io/npm/v/reflect-metadata.svg?logo=npm&logoColor=fff&label=NPM+package&color=limegreen
[npm-url-reflect-metadata]: https://npmjs.org/package/reflect-metadata
[npm-image-tslib]: https://img.shields.io/npm/v/tslib.svg?logo=npm&logoColor=fff&label=NPM+package&color=limegreen
[npm-url-tslib]: https://npmjs.org/package/tslib


Aurora is a web framework, that can create and define a Web Component standards ('custom elements', 'Shadow DOM' and 'HTML Templates'), that compatible with other frameworks, using Typescript.

This framework build with-in a embedded JavaScript Engine [@ibyar/expressions](https://npmjs.org/package/@ibyar/expressions) to execute Template syntax and attributes binding. 


## `Install`

``` bash
npm i --save @ibyar/aurora
```

``` bash
yarn add @ibyar/aurora
```

## Dependencies

| README | Description | NPM |
| ---- | ----------- | --- |
| [@ibyar/aurora](https://github.com/ibyar/aurora/tree/dev/packages/aurora) | a central package to manage dependance only | [![NPM Version][npm-image]][npm-url] |
| [@ibyar/pipes](https://github.com/ibyar/aurora/tree/dev/packages/pipes) | implement all supported pipes | [![NPM Version][npm-image-pipes]][npm-url-pipes] |
| [@ibyar/directives](https://github.com/ibyar/aurora/tree/dev/packages/directives) | implement all supported directives | [![NPM Version][npm-image-directives]][npm-url-directives] |
| [@ibyar/core](https://github.com/ibyar/aurora/tree/dev/packages/core) | create components, render elements, bind attributes, handle events | [![NPM Version][npm-image-core]][npm-url-core] |
| [@ibyar/expressions](https://github.com/ibyar/aurora/tree/dev/packages/expressions) | a JavaScript engine build by the guid of [V8 JavaScript engine](https://github.com/v8/v8), and follow [ESTree](https://github.com/estree/estree/) for generate ast object. | [![NPM Version][npm-image-expressions]][npm-url-expressions] |
| [@ibyar/elements](https://github.com/ibyar/aurora/tree/dev/packages/elements) | parse html and extract bind expression and structural directive | [![NPM Version][npm-image-elements]][npm-url-elements] |
| [@ibyar/platform](https://github.com/ibyar/aurora/tree/dev/packages/platform) | utility package for i18n and plural stuff, json patch | [![NPM Version][npm-image-platform]][npm-url-platform] |
| [reflect-metadata](https://github.com/rbuckton/reflect-metadata) | Proposal to add Metadata to ECMAScript. | [![NPM Version][npm-image-reflect-metadata]][npm-url-reflect-metadata] |
| [tslib](https://github.com/Microsoft/tslib) | This is a runtime library for TypeScript that contains all of the TypeScript helper functions. | [![NPM Version][npm-image-tslib]][npm-url-tslib] |


## 'HTML Template' Features

| Support | HTML Template|
| -------------------- | - |
| Parsing Attributes | ✓ |
| One Way Data Binding | ✓ |
| Two Way Data Binding | ✓ |
| Event Binding | ✓ |
| Template Parser | ✓ |
| Template Syntax | ✓ |
| Template Reference Variables | ✓ |
| Template HTML File | fetch or embedded |
| Fragment | ✓ |
| camelCase Property Naming | ✓ |
| lowercase for root element Property Naming | ✓ |

## Library Features

- [x] ES Module
- [ ] JavaScript API
- [ ] Dependency Injection
- [x] Component
- [x] Directives
- [x] Pipes
- [ ] Services
- [x] Lifecycle
- [x] @Input
- [x] @Output
- [x] @View
- [x] @HostListener
- [x] @ViewChild
- [ ] @HostBinding
- [ ] @ViewChildren
- [ ] @SelfSkip
- [ ] @Optional
- [x] [Annotation/Decorators reflect-metadata][metadata]
- [ ] XSS (cross-site-scripting)

[metadata]: https://github.com/rbuckton/reflect-metadata

## Built-in Directive

#### Structure Directives
- [x] *if
- [x] *for is same as ( *forOf )
- [x] *forIn
- [x] *forAwait		
- [x] *switch and (*case, *default)


 -- see `directive syntax` [structural-directive-syntax-reference](https://github.com/ibyar/aurora/blob/dev/packages/directives/README.md#structural-directive-syntax-reference)

#### Attributes Directives
- [x] class
- [x] style

## Built-in Pipes ( Pipeline operator '|>' )

- [x] async
- [x] json
- [x] lowercase
- [x] uppercase
- [x] titlecase
- [x] keyvalue
- [x] slice
- [ ] date
- [ ] currency
- [ ] number
- [ ] percent
- [ ] i18nPlural
- [ ] i18nSelect


## Web Component standards

- [x]  [Custom Elements][custom]
- [x]  [Shadow DOM][shadow]
- [x]  [HTML Templates Element][template]
- [x]  [HTML Templates Element with Shadow DOM][template]

## Custom Elements standards

- [x] [Reflecting Properties to Attributes][attr-props]
- [x] [Observing Changes to Attributes][observ-attr]
- [x] [Element Upgrades][elem-upgrd]
- [x] [Styling a Custom Element][style]
- [x] [Extending native HTML elements][extend-native]
- [ ] [Extending a Custom Element][extend-custom]
- [x] [Two Component On Same Model Class][two-component]
- [ ] [Two Component Share Same Model Instance][two-component]

## Shadow DOM standards

- [x] [Open Mode][shadow-mode-open]
- [x] [Closed Mode][shadow-mode-closed]
- [x] [delegatesFocus][shadow-focus]
- [x] [Shadow DOM event model][shadow-event]

## HTML Templates Element standards

- [x] [Load template by ID from document][template-id]
- [x] As Normal Custom Element
- [x] As Shadow DOM Element


[attr-props]: https://developers.google.com/web/fundamentals/web-components/customelements#reflectattr
[observ-attr]: https://developers.google.com/web/fundamentals/web-components/customelements#attrchanges
[elem-upgrd]: https://developers.google.com/web/fundamentals/web-components/customelements#upgrades
[custom]: https://developers.google.com/web/fundamentals/web-components/customelements
[shadow]: https://developers.google.com/web/fundamentals/web-components/customelements#shadowdom
[template]: https://developers.google.com/web/fundamentals/web-components/customelements#fromtemplate
[style]: https://developers.google.com/web/fundamentals/web-components/customelements#styling
[extend-custom]: https://developers.google.com/web/fundamentals/web-components/customelements#extendcustomeel
[extend-native]: https://developers.google.com/web/fundamentals/web-components/customelements#extendhtml
[shadow-mode-open]:https://developers.google.com/web/fundamentals/web-components/shadowdom#elements
[shadow-mode-closed]: https://developers.google.com/web/fundamentals/web-components/shadowdom#closed
[shadow-focus]: https://developers.google.com/web/fundamentals/web-components/shadowdom#focus
[shadow-event]: https://developers.google.com/web/fundamentals/web-components/shadowdom#events
[template-id]: https://developers.google.com/web/fundamentals/web-components/customelements#fromtemplate
[two-component]:https://github.com/salemebo/aurora-ts/blob/master/test/multi-component/m-person.tsx


### How to use:



### `HTML -- template parser example`

```ts

import { Component, HostListener, isModel, OnDestroy, OnInit } from '@ibyar/aurora';
import { interval, Subscription } from 'rxjs';

@Component({
	selector: 'pipe-app',
	template: `
	<style>.bs-color{color: var({{currentColor}});}</style>
	<div *for="const color of colors">
		color: {{color}} <span *if="color === currentColor" class="bs-color"> Current Color ='{{currentColor}}'</span>
	</div>
    <table class="table">
        <thead>
            <tr>
                <th class="bs-color" scope="col">pipe</th>
                <th class="bs-color" scope="col">expression</th>
                <th class="bs-color" scope="col">view</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>async</td>
                <td>observable |> async</td>
                <td>{{observable |> async}}</td>
            </tr>
            <tr>
                <td>*</td>
                <td>text</td>
                <td>{{text}}</td>
            </tr>
            <tr>
                <td>lowercase</td>
                <td>text |> lowercase</td>
                <td>{{text |> lowercase}}</td>
            </tr>
            <tr>
                <td>titlecase</td>
                <td>text |> titlecase</td>
                <td>{{text |> titlecase}}</td>
            </tr>
            <tr>
                <td>uppercase</td>
                <td>text |> uppercase</td>
                <td>{{text |> uppercase}}</td>
            </tr>
            <tr>
                <td>json</td>
                <td>obj |> json</td>
                <td>{{obj |> json}}</td>
            </tr>
            <tr>
                <td>json <small>pre element</small></td>
                <td>obj |> json:undefined:2</td>
                <td>
                    <pre>{{obj |> json:undefined:2}}</pre>
                </td>
            </tr>
            <tr>
                <td>keyvalue</td>
                <td>keyValueObject |> keyvalue</td>
                <td>{{keyValueObject |> keyvalue |> json}}</td>
            </tr>
            <tr>
                <td>keyvalue</td>
                <td>keyValueObject |> keyvalue</td>
                <td>{{keyValueObject |> keyvalue |> json}}</td>
            </tr>
            <tr>
                <td>keyvalue</td>
                <td>keyValueMap |> keyvalue</td>
                <td>{{keyValueMap |> keyvalue |> json}}</td>
            </tr>
            <tr>
                <td>slice</td>
                <td>array |> slice:1:3</td>
                <td>{{array |> slice:1:3}}</td>
            </tr>
            <tr>
                <td>slice</td>
                <td>slice(array, 1, 3)</td>
                <td>{{slice(array, 1, 3)}}</td>
            </tr>
            <tr>
                <td>call windows method directly</td>
                <td>3345.54645 |> Math.trunc</td>
                <td>{{3345.54645 |> Math.trunc}}</td>
            </tr>
        </tbody>
    </table>
    `
})
export class PipeAppComponent implements OnInit, OnDestroy {

	text = 'Lorem ipsum is placeholder text commonly used in the graphic, print, and publishing industries for previewing layouts and visual mockups';
	obj = {
		a: [1, 2, 3],
		b: 'property b',
		c: {
			d: [],
			e: 4,
			f: [{ 5: 'g' }]
		}
	};

	keyValueObject = {
		1: 100,
		a: 'A00'
	};
	keyValueArray = [200, 300];
	keyValueMap = new Map<number, number | string>([[1, 400], [2, 500], [3, 'B200']]);

	observable = interval(1000);

	array = ['a', 'b', 'c', 'd'];

	colors = [
		'--bs-blue',
		'--bs-indigo',
		'--bs-purple',
		'--bs-pink',
		'--bs-red',
		'--bs-orange',
		'--bs-yellow',
		'--bs-green',
		'--bs-teal',
		'--bs-cyan',
		'--bs-white',
		'--bs-gray',
		'--bs-gray-dark'
	];

	currentColor = this.colors[0];

	subscription: Subscription;

	onInit() {
		let index = 0;
		this.subscription = this.observable.subscribe(() => {
			if (index === this.colors.length) {
				index = 0;
			}
			this.currentColor = this.colors[index++];
			if (isModel(this)) {
				this.emitChangeModel('currentColor');
			}
			console.log(this.currentColor);
		});
	}

	@HostListener('currentColor')
	onCurrentColorChange() {
		console.log(this.currentColor);
	}

	onDestroy() {
		this.subscription.unsubscribe();
	}

}

```

in index.html add:

```html
    <body>
		<pipe-app></pipe-app>
        <script type="module" src="path-to-main-file/index.js"></script>
    </body>
```

#### how to build

```bash
git clone https://github.com/ibyar/aurora.git
cd aurora
yarn install
yarn build
```

## For NPM 7(workshop support):

```bash
git clone https://github.com/ibyar/aurora.git
cd aurora
npm install
npm run build
```

see test app for full [`example`](https://github.com/ibyar/aurora/tree/dev/example)

## WebPack bundle

see test app for full [`bundles/webpack`](https://github.com/ibyar/aurora/tree/dev/bundles/webpack)

see test app for full [`bundles/rollup`](https://github.com/ibyar/aurora/tree/dev/bundles/rollup)
