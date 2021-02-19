import type { EvaluateNode, EvaluateType } from './types.js';
import type { NodeDeserializer, ExpressionNode } from '../expression.js';
import { InfixExpressionNode } from '../abstract.js';
import { Deserializer } from '../deserialize/deserialize.js';

@Deserializer('shift')
export class BitwiseShiftNode extends InfixExpressionNode {

	static fromJSON(node: BitwiseShiftNode, deserializer: NodeDeserializer): BitwiseShiftNode {
		return new BitwiseShiftNode(
			node.op,
			deserializer(node.left),
			deserializer(node.right)
		);
	}


	static Evaluations: EvaluateType = {
		// Bitwise shift operators
		'<<': (evalNode: EvaluateNode) => { return evalNode.left << evalNode.right; },
		'>>': (evalNode: EvaluateNode) => { return evalNode.left >> evalNode.right; },
		'>>>': (evalNode: EvaluateNode) => { return evalNode.left >>> evalNode.right; },
	};

	static KEYWORDS = Object.keys(BitwiseShiftNode.Evaluations);

	constructor(op: string, left: ExpressionNode, right: ExpressionNode) {
		if (!(BitwiseShiftNode.KEYWORDS.includes(op))) {
			throw new Error(`[${op}]: operation has no implementation yet`);
		}
		super(op, left, right);
	}

	evalNode(evalNode: EvaluateNode) {
		return BitwiseShiftNode.Evaluations[this.op](evalNode);
	}

}

@Deserializer('binary')
export class BinaryBitwiseNode extends InfixExpressionNode {

	static fromJSON(node: BinaryBitwiseNode, deserializer: NodeDeserializer): BinaryBitwiseNode {
		return new BinaryBitwiseNode(
			node.op,
			deserializer(node.left),
			deserializer(node.right)
		);
	}


	static Evaluations: EvaluateType = {
		// Binary bitwise operators
		'&': (evalNode: EvaluateNode) => { return evalNode.left & evalNode.right; },
		'|': (evalNode: EvaluateNode) => { return evalNode.left | evalNode.right; },
		'^': (evalNode: EvaluateNode) => { return evalNode.left ^ evalNode.right; },
	};

	static KEYWORDS = Object.keys(BinaryBitwiseNode.Evaluations);

	constructor(op: string, left: ExpressionNode, right: ExpressionNode) {
		if (!(BinaryBitwiseNode.KEYWORDS.includes(op))) {
			throw new Error(`[${op}]: operation has no implementation yet`);
		}
		super(op, left, right);
	}

	evalNode(evalNode: EvaluateNode) {
		return BinaryBitwiseNode.Evaluations[this.op](evalNode);
	}

}
