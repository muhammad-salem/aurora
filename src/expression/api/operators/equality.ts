import type { EvaluateNode, EvaluateType } from './types.js';
import type { ExpDeserializer, ExpressionNode } from '../expression.js';
import { InfixExpressionNode } from '../abstract.js';
import { Deserializer } from '../deserialize/deserialize.js';

@Deserializer()
export class EqualityNode extends InfixExpressionNode {

    static fromJSON(node: EqualityNode, serializer: ExpDeserializer): EqualityNode {
        return new EqualityNode(
            node.op,
            serializer(node.left as any),
            serializer(node.right as any)
        );
    }


    static Evaluations: EvaluateType = {
        '==': (evalNode: EvaluateNode) => { return evalNode.left == evalNode.right; },
        '!=': (evalNode: EvaluateNode) => { return evalNode.left != evalNode.right; },

        '===': (evalNode: EvaluateNode) => { return evalNode.left === evalNode.right; },
        '!==': (evalNode: EvaluateNode) => { return evalNode.left !== evalNode.right; },
    };

    static KEYWORDS = Object.keys(EqualityNode.Evaluations);

    constructor(op: string, left: ExpressionNode, right: ExpressionNode) {
        if (!(EqualityNode.KEYWORDS.includes(op))) {
            throw new Error(`[${op}]: operation has no implementation yet`);
        }
        super(op, left, right);
    }

    evalNode(evalNode: EvaluateNode) {
        return EqualityNode.Evaluations[this.op](evalNode);
    }
}
