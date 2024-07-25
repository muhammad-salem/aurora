export * from './transformer/factory.js';
export * from './transformer/helpers.js';
export * from './transformer/modules.js';
export * from './transformer/before-component.js';
export * from './transformer/before-directive.js';
export * from './transformer/after-declarations-component.js';
export * from './transformer/after-declarations-directive.js';
export * from './directives/register.js';
export * from './compiler/compiler.js';
export * from './elements/tags.js';
export * from './webpack/loader.js';

import { loader } from './webpack/loader.js';
export default loader;
