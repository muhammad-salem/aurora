import { directiveRegistry } from '@ibyar/elements/node.js';

/**
 * register `class` and `style` attribute directive
 */
directiveRegistry.register('class', { inputs: ['class'] });
directiveRegistry.register('style', { inputs: ['style'] });

/**
 * for of/await/in directives
 */
directiveRegistry.register('*for', { inputs: ['of', 'trackBy'], successor: '*empty' });
directiveRegistry.register('*forOf', { inputs: ['of', 'trackBy'], successor: '*empty' });
directiveRegistry.register('*forAwait', { inputs: ['of'], successor: '*empty' });
directiveRegistry.register('*forIn', { inputs: ['in'], successor: '*empty' });

/**
 * if then else directive
 */
directiveRegistry.register('*if', { inputs: ['if', 'then', 'else'], successor: '*else' });

/**
 * switch case default directives
 */
directiveRegistry.register('*switch', { inputs: ['switch'] });
directiveRegistry.register('*case', { inputs: ['case'] });
directiveRegistry.register('*default', { inputs: ['default'] });
