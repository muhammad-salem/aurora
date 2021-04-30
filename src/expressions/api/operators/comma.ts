import type { NodeDeserializer, ExpressionNode } from '../expression.js';
import { AbstractExpressionNode } from '../abstract.js';
import { Deserializer } from '../deserialize/deserialize.js';
import { ScopedStack } from '../scope.js';

@Deserializer('comma')
export class CommaNode extends AbstractExpressionNode {
	static fromJSON(node: CommaNode, deserializer: NodeDeserializer): CommaNode {
		return new CommaNode(node.expressions.map(expression => deserializer(expression as any)));
	}
	constructor(private expressions: ExpressionNode[]) {
		super();
	}
	getExpressions() {
		return this.expressions;
	}
	set(stack: ScopedStack) {
		throw new Error(`CommaNode.#set() has no implementation.`);
	}
	get(stack: ScopedStack) {
		return this.expressions.map(expr => expr.get(stack)).pop();
	}
	entry(): string[] {
		return [...this.expressions.flatMap(expression => expression.entry())];
	}
	event(parent?: string): string[] {
		return [...this.expressions.flatMap(expression => expression.event())];
	}
	toString() {
		const isObject = true;
		return this.expressions.map(key => key.toString()).join(', ');
	}
	toJson(): object {
		return {
			expressions: this.expressions.map(expression => expression.toJSON())
		};
	}
}
