import type { NodeDeserializer, ExpressionNode, ExpressionEventPath } from '../expression.js';
import type { Scope } from '../../scope/scope.js';
import type { Stack } from '../../scope/stack.js';
import { AbstractExpressionNode } from '../abstract.js';
import { Deserializer } from '../deserialize/deserialize.js';

@Deserializer('SequenceExpression')
export class SequenceExpression extends AbstractExpressionNode {
	static fromJSON(node: SequenceExpression, deserializer: NodeDeserializer): SequenceExpression {
		return new SequenceExpression(node.expressions.map(expression => deserializer(expression as any)));
	}
	constructor(private expressions: ExpressionNode[]) {
		super();
	}
	getExpressions() {
		return this.expressions;
	}
	shareVariables(scopeList: Scope<any>[]): void {
		this.expressions.forEach(statement => statement.shareVariables(scopeList));
	}
	set(stack: Stack) {
		throw new Error(`SequenceExpression.#set() has no implementation.`);
	}
	get(stack: Stack) {
		return this.expressions.map(expr => expr.get(stack)).pop();
	}
	dependency(): ExpressionNode[] {
		return this.expressions.flatMap(exp => exp.dependency());
	}
	dependencyPath(computed: true): ExpressionEventPath[] {
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
