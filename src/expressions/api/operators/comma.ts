import type {
	NodeDeserializer, ExpressionNode, ExpressionEventPath,
	VisitNodeType, SourceLocation
} from '../expression.js';
import type { Stack } from '../../scope/stack.js';
import { AbstractExpressionNode } from '../abstract.js';
import { Deserializer } from '../deserialize/deserialize.js';

@Deserializer('SequenceExpression')
export class SequenceExpression extends AbstractExpressionNode {
	static fromJSON(node: SequenceExpression, deserializer: NodeDeserializer): SequenceExpression {
		return new SequenceExpression(node.expressions.map(deserializer), node.loc);
	}
	static visit(node: SequenceExpression, visitNode: VisitNodeType): void {
		node.expressions.forEach(visitNode);
	}
	constructor(private expressions: ExpressionNode[], loc?: SourceLocation) {
		super(loc);
	}
	getExpressions() {
		return this.expressions;
	}
	set(stack: Stack) {
		throw new Error(`SequenceExpression.#set() has no implementation.`);
	}
	get(stack: Stack) {
		return this.expressions.map(expr => expr.get(stack)).pop();
	}
	dependency(computed?: true): ExpressionNode[] {
		return this.expressions.flatMap(exp => exp.dependency(computed));
	}
	dependencyPath(computed?: true): ExpressionEventPath[] {
		return this.expressions.flatMap(expression => expression.dependencyPath(computed));
	}
	toString() {
		return this.expressions.map(key => key.toString()).join(', ');
	}
	toJson(): object {
		return {
			expressions: this.expressions.map(expression => expression.toJSON())
		};
	}
}
