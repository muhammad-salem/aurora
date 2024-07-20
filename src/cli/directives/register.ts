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
