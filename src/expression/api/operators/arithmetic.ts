import type { EvaluateNode, EvaluateType } from './types.js';
import type { ExpressionDeserializer, ExpressionNode } from '../expression.js';
import { InfixExpressionNode } from '../abstract.js';
import { Deserializer } from '../deserialize/deserialize.js';

@Deserializer()
export class ArithmeticNode extends InfixExpressionNode {

    static fromJSON(node: ArithmeticNode, deserializer: ExpressionDeserializer): ArithmeticNode {
        return new ArithmeticNode(
            node.op,
            deserializer(node.left as any),
            deserializer(node.right as any)
        );
    }

    static Evaluations: EvaluateType = {

        '+': (evalNode: EvaluateNode) => { return evalNode.left + evalNode.right; },
        '-': (evalNode: EvaluateNode) => { return evalNode.left - evalNode.right; },
        '*': (evalNode: EvaluateNode) => { return evalNode.left * evalNode.right; },
        '/': (evalNode: EvaluateNode) => { return evalNode.left / evalNode.right; },

        '%': (evalNode: EvaluateNode) => { return evalNode.left % evalNode.right; },
        '**': (evalNode: EvaluateNode) => { return evalNode.left ** evalNode.right; },
    };

    static KEYWORDS = Object.keys(ArithmeticNode.Evaluations);

    constructor(op: string, left: ExpressionNode, right: ExpressionNode) {
        if (!(ArithmeticNode.KEYWORDS.includes(op))) {
            throw new Error(`[${op}]: operation has no implementation yet`);
        }
        super(op, left, right);
    }

    evalNode(evalNode: EvaluateNode) {
        return ArithmeticNode.Evaluations[this.op](evalNode);
    }
}
