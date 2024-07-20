import { registerDirective } from '@ibyar/core/node.js';
import { directiveRegistry } from '@ibyar/elements/node.js';
import { DecoratorInfo } from '../transformer/modules.js';
import { metadataHoler } from '@ibyar/decorators';

interface DirectiveInfo {
	selector: string,
	successor?: string,
	inputs: DecoratorInfo[],
	outputs: DecoratorInfo[],
}
export function registerDirectiveCall(info: DirectiveInfo) {
	directiveRegistry.register(info.selector, {
		successor: info.successor,
		inputs: info.inputs.map(i => i.aliasName),
		outputs: info.outputs.map(i => i.aliasName),
	});
	const modelClass = {};
	const metadata = metadataHoler.createAndAssign(modelClass);
	metadata.modelClass = modelClass;
	metadata.selector = info.selector;
	metadata.inputs = info.inputs.map(input => ({ modelProperty: input.name, viewAttribute: input.aliasName }));
	registerDirective(modelClass);
}


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
