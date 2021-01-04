/// <reference types="@aurorats/types" />

console.log('index.js loaded');

import { HTMLComponent } from '@aurorats/core';
import 'bootstrap/dist/css/bootstrap.min.css';
export * from './app-root/app-root-component.js';

export * from './person-app/person';
export * from './person-app/person-app';

export * from './two-way/binding-2-way';

import { AppRoot } from './app-root/app-root-component';
import './pipe-app/pipe-test';

// let appRoot = new AppRoot();
// appRoot.appSelector = [
//     'person-app'
// ];

let appRoot = document.getElementById('app-root') as HTMLComponent<AppRoot>;

appRoot._model.appSelector = [
    'person-app',
    'bind-2way',
    'pipe-app'
];
document.body.append(appRoot);
