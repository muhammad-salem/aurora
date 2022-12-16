import type { NodeDeserializer, VisitNodeType } from '../expression.js';
import { InfixExpressionNode } from '../abstract.js';
import { Deserializer } from '../deserialize/deserialize.js';

export type LogicalOperator = '||' | '&&' | '??';

@Deserializer('LogicalExpression')
export class LogicalExpression extends InfixExpressionNode<LogicalOperator> {
	static fromJSON(node: LogicalExpression, deserializer: NodeDeserializer): LogicalExpression {
		return new LogicalExpression(
			node.operator,
			deserializer(node.left),
			deserializer(node.right),
			node.loc
		);
	}
	static visit(node: LogicalExpression, visitNode: VisitNodeType): void {
		visitNode(node.left);
		visitNode(node.right);
	}
	static Evaluations: { [key: string]: (exp: LogicalExpression, context: any) => any } = {

		'&&': (exp: LogicalExpression, context: any) => {
			let value = exp.left.get(context);
			if (value) {
				value = exp.right.get(context);
			}
			return value;
		},

		'||': (exp: LogicalExpression, context: any) => {
			let value = exp.left.get(context);
			if (!value) {
				value = exp.right.get(context);
			}
			return value;
		},

		'??': (exp: LogicalExpression, context: any) => {
			let value = exp.left.get(context);
			if (value === undefined || value === null) {
				value = exp.right.get(context);
			}
			return value;
		}

	};
	get(context: object) {
		return LogicalExpression.Evaluations[this.operator](this, context);
	}
}
