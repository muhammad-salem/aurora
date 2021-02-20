import type { EvaluateNode, EvaluateType } from './types.js';
import type { NodeDeserializer, ExpressionNode } from '../expression.js';
import { InfixExpressionNode } from '../abstract.js';
import { Deserializer } from '../deserialize/deserialize.js';

@Deserializer('relational')
export class RelationalNode extends InfixExpressionNode {

	static fromJSON(node: RelationalNode, deserializer: NodeDeserializer): RelationalNode {
		return new RelationalNode(
			node.op,
			deserializer(node.left),
			deserializer(node.right)
		);
	}

	static Evaluations: EvaluateType = {
		'<': (evalNode: EvaluateNode) => { return evalNode.left < evalNode.right; },
		'<=': (evalNode: EvaluateNode) => { return evalNode.left <= evalNode.right; },

		'>': (evalNode: EvaluateNode) => { return evalNode.left > evalNode.right; },
		'>=': (evalNode: EvaluateNode) => { return evalNode.left >= evalNode.right; },

		'in': (evalNode: EvaluateNode) => { return evalNode.left in evalNode.right; },
		'instanceof': (evalNode: EvaluateNode) => { return evalNode.left instanceof evalNode.right; },
	};

	static KEYWORDS = ['<', '<=', '>', '>=', 'in', 'instanceof'];

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
