
import { HTMLComponent } from '@ibyar/aurora';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap';
import '@popperjs/core';

// import structural directives first
// so it can register itself with the html parser as a node
export * from './directive/add-note.directive.js';
export * from './directive/notify-user.directive.js';
export * from './directive/red-note.directive.js';
export * from './directive/time.directive.js';

export * from './app-root/app-root-component.js';

export * from './person-app/person.js';
export * from './person-app/person-app.js';

export * from './two-way/binding-2-way.js';

export * from './video-player/video.js';

import { AppRoot } from './app-root/app-root-component.js';
import './pipe-app/pipe-test.js';
import { from } from 'rxjs';

const appRoot = document.getElementById('app-root') as HTMLComponent<AppRoot> & AppRoot;

appRoot.selectors = [
	'person-app',
	{ tag: 'div', is: 'bind-2way' },
	'pipe-app',
	'video-play-list'
];

appRoot._model.emitChangeModel('apps');
