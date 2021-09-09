/// <reference types="@ibyar/types" />
import '@ibyar/example';
import { Component } from '@ibyar/core';
import helloTemplate from './hello.html';

@Component({
	selector: 'hello-app',
	template: helloTemplate,
})
export class HelloApp {
	name = 'jon'
}
