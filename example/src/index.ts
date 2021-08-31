/// <reference types="@ibyar/types" />

import { HTMLComponent } from '@ibyar/aurora';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap';
import '@popperjs/core';
export * from './app-root/app-root-component';

export * from './person-app/person';
export * from './person-app/person-app';

export * from './two-way/binding-2-way';

export * from './video-player/video';

import { AppRoot } from './app-root/app-root-component';
import './pipe-app/pipe-test';

const appRoot = document.getElementById('app-root') as HTMLComponent<AppRoot>;
appRoot._model.setAppSelector([
	'person-app',
	{ tag: 'div', is: 'bind-2way' },
	'pipe-app',
	'video-play-list'
]);
