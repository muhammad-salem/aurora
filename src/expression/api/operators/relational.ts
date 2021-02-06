import type { EvaluateNode, EvaluateType } from './types.js';
import type { NodeDeserializer, ExpressionNode } from '../expression.js';
import { InfixExpressionNode } from '../abstract.js';
import { Deserializer } from '../deserialize/deserialize.js';

@Deserializer('compare')
export class CompareNode extends InfixExpressionNode {

    static fromJSON(node: CompareNode, deserializer: NodeDeserializer): CompareNode {
        return new CompareNode(
            node.op,
            deserializer(node.left),
            deserializer(node.right)
        );
    }

    static Evaluations: EvaluateType = {
        'in': (evalNode: EvaluateNode) => { return evalNode.left in evalNode.right; },
        'instanceof': (evalNode: EvaluateNode) => { return evalNode.left instanceof evalNode.right; },

        '<': (evalNode: EvaluateNode) => { return evalNode.left < evalNode.right; },
        '>': (evalNode: EvaluateNode) => { return evalNode.left > evalNode.right; },

        '>=': (evalNode: EvaluateNode) => { return evalNode.left >= evalNode.right; },
        '<=': (evalNode: EvaluateNode) => { return evalNode.left <= evalNode.right; },
    };

    static KEYWORDS = Object.keys(CompareNode.Evaluations);

    constructor(op: string, left: ExpressionNode, right: ExpressionNode) {
        if (!(CompareNode.KEYWORDS.includes(op))) {
            throw new Error(`[${op}]: operation has no implementation yet`);
        }
        super(op, left, right);
    }

    evalNode(evalNode: EvaluateNode) {
        return CompareNode.Evaluations[this.op](evalNode);
    }
}
