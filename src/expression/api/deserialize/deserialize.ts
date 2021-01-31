import type { ExpDeserializer, ExpressionNode, NodeExpressionClass } from '../expression.js';

const ClassMap: Map<string, NodeExpressionClass<ExpressionNode>> = new Map();

export const nodeDeserializer: ExpDeserializer = (node) => {
    return ClassMap.get(node.type)!.fromJSON(node.node as any, nodeDeserializer);
};

export function Deserializer(): Function {
    return (target: NodeExpressionClass<ExpressionNode>) => {
        ClassMap.set(target.name, target);
        return target;
    };
}
