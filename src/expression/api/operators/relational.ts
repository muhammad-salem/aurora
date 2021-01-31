import type { EvaluateNode, EvaluateType } from './types.js';
import type { ExpDeserializer, ExpressionNode } from '../expression.js';
import { InfixExpressionNode } from '../abstract.js';
import { Deserializer } from '../deserialize/deserialize.js';

@Deserializer()
export class RelationalNode extends InfixExpressionNode {

    static fromJSON(node: RelationalNode, serializer: ExpDeserializer): RelationalNode {
        return new RelationalNode(
            node.op,
            serializer(node.left as any),
            serializer(node.right as any)
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

    static KEYWORDS = Object.keys(RelationalNode.Evaluations);

    constructor(op: string, left: ExpressionNode, right: ExpressionNode) {
        if (!(RelationalNode.KEYWORDS.includes(op))) {
            throw new Error(`[${op}]: operation has no implementation yet`);
        }
        super(op, left, right);
    }

    evalNode(evalNode: EvaluateNode) {
        return RelationalNode.Evaluations[this.op](evalNode);
    }
}
