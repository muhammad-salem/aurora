
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap';
import '@popperjs/core';

// import structural directives first
// so it can register itself with the html parser as a node
export * from './directive/add-note.directive.js';
export * from './directive/notify-user.directive.js';
export * from './directive/time.directive.js';

export * from './person-app/person.js';
export * from './person-app/person-app.js';

export * from './two-way/binding-2-way.js';
export * from './two-way/shared-model.js';

export * from './video-player/video.js';

export * from './pipe-app/pipe-test.js';

export * from './route/router-outlet.js';

export * from './github/user.js';

export * from './app-root.js';
