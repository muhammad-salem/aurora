
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap';
import '@popperjs/core';

// import structural directives first
// so it can register itself with the html parser as a node
export * from './directive/add-note.directive.js';
export * from './directive/notify-user.directive.js';
export * from './directive/time.directive.js';

export * from './route/component-outlet.js';
export * from './route/router-outlet.js';

export * from './app-root.js';

