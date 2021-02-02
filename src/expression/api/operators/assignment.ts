import type { EvaluateNode, EvaluateType } from './types.js';
import type { ExpressionDeserializer, ExpressionNode } from '../expression.js';
import { InfixExpressionNode } from '../abstract.js';
import { Deserializer } from '../deserialize/deserialize.js';

@Deserializer()
export class AssignmentNode extends InfixExpressionNode {

    static fromJSON(node: AssignmentNode, deserializer: ExpressionDeserializer): AssignmentNode {
        return new AssignmentNode(
            node.op,
            deserializer(node.left as any),
            deserializer(node.right as any)
        );
    }

    static Evaluations: EvaluateType = {

        '=': (evalNode: EvaluateNode) => { return evalNode.left = evalNode.right; },
        '*=': (evalNode: EvaluateNode) => { return evalNode.left *= evalNode.right; },
        '**=': (evalNode: EvaluateNode) => { return evalNode.left **= evalNode.right; },

        '/=': (evalNode: EvaluateNode) => { return evalNode.left /= evalNode.right; },
        '%=': (evalNode: EvaluateNode) => { return evalNode.left %= evalNode.right; },

        '+=': (evalNode: EvaluateNode) => { return evalNode.left += evalNode.right; },
        '-=': (evalNode: EvaluateNode) => { return evalNode.left -= evalNode.right; },


        '<<=': (evalNode: EvaluateNode) => { return evalNode.left <<= evalNode.right; },
        '>>=': (evalNode: EvaluateNode) => { return evalNode.left >>= evalNode.right; },
        '>>>=': (evalNode: EvaluateNode) => { return evalNode.left >>>= evalNode.right; },


        '&=': (evalNode: EvaluateNode) => { return evalNode.left &= evalNode.right; },
        '^=': (evalNode: EvaluateNode) => { return evalNode.left ^= evalNode.right; },
        '|=': (evalNode: EvaluateNode) => { return evalNode.left |= evalNode.right; },

    };

    static KEYWORDS = Object.keys(AssignmentNode.Evaluations);

    constructor(op: string, left: ExpressionNode, right: ExpressionNode) {
        if (!(AssignmentNode.KEYWORDS.includes(op))) {
            throw new Error(`[${op}]: operation has no implementation yet`);
        }
        super(op, left, right);
    }

    evalNode(evalNode: EvaluateNode) {
        return AssignmentNode.Evaluations[this.op](evalNode);
    }

}
