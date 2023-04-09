import type { ExpressionNode, ExpressionNodConstructor } from '../expression.js';
import { makeClassDecorator } from '@ibyar/decorators';
import { expressionTypes } from './type-store.js';

export const Deserializer = makeClassDecorator<string, ExpressionNodConstructor<ExpressionNode>>(
	(type, target) => {
		target.type = type;
		expressionTypes.set(type, target);
	}
);

export function getDeserializerType(target: ExpressionNodConstructor<ExpressionNode>) {
	return target.type;
}

export function serializeNode(node: ExpressionNode) {
	return JSON.stringify(node);
}


/**
 * convert from json expression `JSON.stringify(node)` or `serializeNode` to `ExpressionNode`
 * @param node as type `NodeJsonType`
 * @returns ExpressionNode
 */
export function deserialize(node: ExpressionNode) {
	const fromJSON = expressionTypes.get((<any>node).type)?.fromJSON;
	if (fromJSON) {
		return fromJSON(node, deserialize);
	} else {
		throw new Error(`Couldn't find Expression class for name: ${JSON.stringify(node)}.`);
	}
}

export function deserializeNode(node: string) {
	const exp = JSON.parse(node);
	return deserialize(exp);
}
