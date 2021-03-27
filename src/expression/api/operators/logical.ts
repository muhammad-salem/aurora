import type { NodeDeserializer, ExpressionNode } from '../expression.js';
import { InfixExpressionNode } from '../abstract.js';
import { Deserializer } from '../deserialize/deserialize.js';

@Deserializer('logical')
export class LogicalNode extends InfixExpressionNode {
	static fromJSON(node: LogicalNode, deserializer: NodeDeserializer): LogicalNode {
		return new LogicalNode(
			node.op,
			deserializer(node.left),
			deserializer(node.right)
		);
	}
	static Evaluations: { [key: string]: (exp: LogicalNode, context: any) => any } = {

		'&&': (exp: LogicalNode, context: any) => {
			let value = exp.left.get(context);
			if (value) {
				value = exp.right.get(context);
			}
			return value;
		},

		'||': (exp: LogicalNode, context: any) => {
			let value = exp.left.get(context);
			if (!value) {
				value = exp.right.get(context);
			}
			return value;
		},

		'??': (exp: LogicalNode, context: any) => {
			let value = exp.left.get(context);
			if (value === undefined || value === null) {
				value = exp.right.get(context);
			}
			return value;
		}

	};
	static KEYWORDS = ['&&', '||', '??'];
	constructor(op: string, left: ExpressionNode, right: ExpressionNode) {
		if (!(LogicalNode.KEYWORDS.includes(op))) {
			throw new Error(`[${op}]: operation has no implementation yet`);
		}
		super(op, left, right);
	}
	get(context: object) {
		return LogicalNode.Evaluations[this.op](this, context);
	}
	evalNode() {
		throw new Error('no need for this method in LogicalNode class');
	}
}


@Deserializer('logical-assign')
export class LogicalAssignmentNode extends InfixExpressionNode {
	static fromJSON(node: LogicalAssignmentNode, deserializer: NodeDeserializer): LogicalAssignmentNode {
		return new LogicalAssignmentNode(
			node.op,
			deserializer(node.left),
			deserializer(node.right)
		);
	}
	static Evaluations: { [key: string]: (exp: LogicalAssignmentNode, context: any) => any } = {

		'&&=': (exp: LogicalAssignmentNode, context: any) => {
			let value = exp.left.get(context);
			if (value) {
				value = exp.right.get(context);
				exp.set(context, value);
			}
			return value;
		},

		'||=': (exp: LogicalAssignmentNode, context: any) => {
			let value = exp.left.get(context);
			if (!value) {
				value = exp.right.get(context);
				exp.set(context, value);
			}
			return value;
		},

		'??=': (exp: LogicalAssignmentNode, context: any) => {
			let value = exp.left.get(context);
			if (value === undefined || value === null) {
				value = exp.right.get(context);
				exp.set(context, value);
			}
			return value;
		}

	};
	static KEYWORDS = ['&&=', '||=', '??='];
	constructor(op: string, left: ExpressionNode, right: ExpressionNode) {
		if (!(LogicalAssignmentNode.KEYWORDS.includes(op))) {
			throw new Error(`[${op}]: operation has no implementation yet`);
		}
		super(op, left, right);
	}
	get(context: object) {
		return LogicalAssignmentNode.Evaluations[this.op](this, context);
	}
	evalNode() {
		throw new Error('no need for this method in LogicalNode class');
	}
}
