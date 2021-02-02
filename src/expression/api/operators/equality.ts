import type { EvaluateNode, EvaluateType } from './types.js';
import type { ExpressionDeserializer, ExpressionNode } from '../expression.js';
import { InfixExpressionNode } from '../abstract.js';
import { Deserializer } from '../deserialize/deserialize.js';

@Deserializer()
export class EqualityNode extends InfixExpressionNode {

    static fromJSON(node: EqualityNode, deserializer: ExpressionDeserializer): EqualityNode {
        return new EqualityNode(
            node.op,
            deserializer(node.left as any),
            deserializer(node.right as any)
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
