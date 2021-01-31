import type { EvaluateNode, EvaluateType } from './types.js';
import type { ExpDeserializer, ExpressionNode } from '../expression.js';
import { InfixExpressionNode } from '../abstract.js';
import { Deserializer } from '../deserialize/deserialize.js';

@Deserializer()
export class BitwiseNode extends InfixExpressionNode {

    static fromJSON(node: BitwiseNode, serializer: ExpDeserializer): BitwiseNode {
        return new BitwiseNode(
            node.op,
            serializer(node.left as any),
            serializer(node.right as any)
        );
    }


    static Evaluations: EvaluateType = {
        // Bitwise shift operators
        '<<': (evalNode: EvaluateNode) => { return evalNode.left << evalNode.right; },
        '>>': (evalNode: EvaluateNode) => { return evalNode.left >> evalNode.right; },
        '>>>': (evalNode: EvaluateNode) => { return evalNode.left >>> evalNode.right; },

        // Binary bitwise operators
        '&': (evalNode: EvaluateNode) => { return evalNode.left & evalNode.right; },
        '|': (evalNode: EvaluateNode) => { return evalNode.left | evalNode.right; },
        '^': (evalNode: EvaluateNode) => { return evalNode.left ^ evalNode.right; },
    };

    static KEYWORDS = Object.keys(BitwiseNode.Evaluations);

    constructor(op: string, left: ExpressionNode, right: ExpressionNode) {
        if (!(BitwiseNode.KEYWORDS.includes(op))) {
            throw new Error(`[${op}]: operation has no implementation yet`);
        }
        super(op, left, right);
    }

    evalNode(evalNode: EvaluateNode) {
        return BitwiseNode.Evaluations[this.op](evalNode);
    }
}
