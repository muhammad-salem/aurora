# Ibyar JSX

[![NPM Version][npm-image]][npm-url]
[![NPM Downloads][downloads-image]][downloads-url]
[![LICENSE][license-img]][license-url]
[![lerna][lerna-img]][lerna-url]
![GitHub contributors][contributors]

[npm-image]: https://img.shields.io/npm/v/@ibyar/jsx.svg?logo=npm&logoColor=fff&label=NPM+package&color=limegreen
[npm-url]: https://npmjs.org/package/@ibyar/jsx
[downloads-image]: https://img.shields.io/npm/dt/@ibyar/jsx
[downloads-url]: https://npmjs.org/package/@ibyar/jsx
[license-img]: https://img.shields.io/github/license/ibyar/aurora
[license-url]: https://github.com/ibyar/aurora/blob/master/LICENSE
[lerna-img]: https://img.shields.io/badge/maintained%20with-lerna-cc00ff.svg
[lerna-url]: https://lerna.js.org/
[contributors]: https://img.shields.io/github/contributors/ibyar/aurora

Ibyar JSX, create DomNode tree sing jsx, one way binding, two way binding.

## `Install`

``` bash
npm i --save @ibyar/jsx
```

``` bash
yarn add @ibyar/jsx
```


## Example

```tsx
import { jsxParser, Fragment } from '@ibyar/jsx';


@Component({
	selector: 'my-component',
	template: <>foo: [[foo |> json]], bar: [[bar |> json]]</>
})
export class MyComponent {
	/** define inputs and outputs types*/
	props: {
		foo: string;
		bar: string;
	};

	foo: Foo;
	bar: Bar;

}

@Directive({
	selector: '*for'
})
export class ForDirective {

	props: {
		of: string;
	};

	@Input()
	of: any
}


@Component({
	selector: 'jsx-component',
	template: <>
	
	<my-component foo="[(fooValue)]" bar="[barValue]"></my-component>
	
	// class component syntax
	<MyComponent foo="[(fooValue)]" bar="[barValue]"/>
	
	// user directive
	<for of="[users]" let-user>Name: [[user.name]], Age: [[use.age]]</for>

	// class component syntax
	<ForDirective of="[users]" let-user>Name: [[user.name]], Age: [[use.age]]</ForDirective>

	</>
})
export class JsxComponent {
	/** define inputs and outputs types*/
	props: {
		
	};

	fooValue: Foo = new Foo(1);
	barValue: Bar = new Bar(2);

}

```

## supported syntax

every property type should be a string, it going to be resolved at runtime

```jsx

const template = 
<>
text binding [[user.name]]
<div 
	twoWayBinding="[(user.name)]"
	oneWayBinding="[user.name |> uppercase]"
	click="(onClick($event))"
	templateAttribute="user_[[user.name]]"
	></div>
</>;

```