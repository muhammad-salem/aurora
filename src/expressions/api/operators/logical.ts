import type { NodeDeserializer, ExpressionNode } from '../expression';
import { InfixExpressionNode } from '../abstract';
import { Deserializer } from '../deserialize/deserialize';

export type LogicalOperator = '||' | '&&' | '??';

@Deserializer('LogicalExpression')
export class LogicalNode extends InfixExpressionNode<LogicalOperator> {
	static fromJSON(node: LogicalNode, deserializer: NodeDeserializer): LogicalNode {
		return new LogicalNode(
			node.operator,
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
	get(context: object) {
		return LogicalNode.Evaluations[this.operator](this, context);
	}
}
