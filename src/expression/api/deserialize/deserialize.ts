import type { ExpDeserializer, ExpressionNode, NodeExpressionClass } from '../expression.js';

type FromJSON = (node: ExpressionNode, serializer: ExpDeserializer) => ExpressionNode;

const DeserializerMap: Map<string, FromJSON> = new Map();

/**
 * The Expression pDeserializer function
 * convert from json expression `JSON.stringify(node)` to `ExpressionNode`
 * @param node as type `NodeJsonType` 
 * @returns ExpressionNode
 */
export const fromJsonExpression: ExpDeserializer = (node) => {
    const fromJSON = DeserializerMap.get(node.type);
    if (fromJSON) {
        return fromJSON(node.node as any, fromJsonExpression);
    } else {
        throw new Error(`Couldn't find Expression class for name: ${node.type}.`);
    }
};

export function Deserializer(): Function {
    return (target: NodeExpressionClass<ExpressionNode>) => {
        DeserializerMap.set(target.name, target.fromJSON);
        return target;
    };
}
