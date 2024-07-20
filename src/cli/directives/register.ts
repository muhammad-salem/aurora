import { registerDirective } from '@ibyar/core/node.js';
import { directiveRegistry } from '@ibyar/elements/node.js';
import { DecoratorInfo } from '../transformer/modules.js';
import { metadataHoler } from '@ibyar/decorators';

export interface DirectiveInfo {
	selector: string,
	successor?: string,
	inputs?: DecoratorInfo[],
	outputs?: DecoratorInfo[],
}
export function registerDirectiveCall(info: DirectiveInfo) {
	directiveRegistry.register(info.selector, {
		successor: info.successor,
		inputs: info.inputs?.map(i => i.aliasName),
		outputs: info.outputs?.map(i => i.aliasName),
	});
	const modelClass = {};
	const modelKey = {};
	(modelClass as any)[Symbol.metadata] = modelKey;
	const metadata = metadataHoler.getOrCreate(modelKey);
	metadata.modelClass = modelClass;
	metadata.selector = info.selector;
	metadata.inputs = info.inputs?.map(input => ({ modelProperty: input.name, viewAttribute: input.aliasName }));
	registerDirective(modelClass);
}

/**
 * register `class` and `style` attribute directive
 */
registerDirectiveCall({
	selector: 'class',
	inputs: [{ name: 'class', aliasName: 'class' }],
});

registerDirectiveCall({
	selector: 'style',
	inputs: [{ name: 'style', aliasName: 'style' }],
});


// registerDirective

/**
 * for of/await/in directives
 */
registerDirectiveCall({
	selector: '*for',
	successor: '*empty',
	inputs: [
		{ name: 'forOf', aliasName: 'of' },
		{ name: 'trackBy', aliasName: 'trackBy' },
	],
});

registerDirectiveCall({
	selector: '*forOf',
	successor: '*empty',
	inputs: [
		{ name: 'forOf', aliasName: 'of' },
		{ name: 'trackBy', aliasName: 'trackBy' },
	],
});

registerDirectiveCall({
	selector: '*forAwait',
	successor: '*empty',
	inputs: [{ name: 'forOf', aliasName: 'of' },],
});

registerDirectiveCall({
	selector: '*forIn',
	successor: '*empty',
	inputs: [{ name: 'forOf', aliasName: 'of' },],
});


/**
 * if then else directive
 */
registerDirectiveCall({
	selector: '*if',
	successor: '*else',
	inputs: [
		{ name: 'ifCondition', aliasName: 'if' },
		{ name: 'thenTemplateRef', aliasName: 'then' },
		{ name: 'elseTemplateRef', aliasName: 'else' },
	],
});


/**
 * switch case default directives
 */
registerDirectiveCall({
	selector: '*switch',
	inputs: [{ name: 'switchValue', aliasName: 'switch' },],
});

registerDirectiveCall({
	selector: '*case',
	inputs: [{ name: 'caseValue', aliasName: 'case' },],
});

registerDirectiveCall({
	selector: '*default',
	inputs: [{ name: 'defaultCaseValue', aliasName: 'default' },],
});
