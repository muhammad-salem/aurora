import { jsxParser, Fragment } from '@ibyar/jsx';
import { Component, EventEmitter, Metadata, MetadataContext } from '@ibyar/aurora';

let x = <>text<div id="id"></div></>;

console.log(x);
@Component({
	selector: 'my-component',
	template: ''
})
class MyComponent /*implements JsxComponent<{}>*/ {

	@Metadata
	static [Symbol.metadata]: MetadataContext;

	/**
	 * a cli should generate this props
	 */
	props: {
		foo: string;
		bar: string;
	};


	// props: {
	// 	foo: string;
	// 	dddd: string;
	// 	event: string;
	// };

	foo: string;

	dddd: number;

	sss: string = '';
	// private privateProperty: string;

	// event = new EventEmitter<string>();
}

let t = <>
	text1
	<div id="id" #for="dddd" for="(ssss)" about="[about]" key="[(data)]"></div>
	text2
	<MyComponent foo={''} bar={''} ></MyComponent>
	<template></template>
	text [[data]] text
</>;

console.log('t', t);


@Component({
	selector: 'jsx-test',
	template: t
})
export class JsxComponentTest {

	@Metadata
	static [Symbol.metadata]: MetadataContext;
	about: string;
}