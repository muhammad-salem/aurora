import type { NodeDeserializer, ExpressionNode } from '../expression.js';
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
	set(stack: Stack) {
		throw new Error(`SequenceExpression.#set() has no implementation.`);
	}
	get(stack: Stack) {
		return this.expressions.map(expr => expr.get(stack)).pop();
	}
	events(parent?: string): string[] {
		return [...this.expressions.flatMap(expression => expression.events())];
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
