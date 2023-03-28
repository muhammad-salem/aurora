/// <reference types="@ibyar/types" />
import '@ibyar/example';
import { Component, Metadata, MetadataContext } from '@ibyar/core';
import helloTemplate from './hello.html';

@Component({
	selector: 'hello-app',
	template: helloTemplate,
})
export class HelloApp {

	@Metadata
	static [Symbol.metadata]: MetadataContext;

	name = 'jon'
}
