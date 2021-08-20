import type { NodeDeserializer, ExpressionNode } from '../expression.js';
import { AbstractExpressionNode } from '../abstract.js';
import { Deserializer } from '../deserialize/deserialize.js';
import { StackProvider } from '../scope.js';

@Deserializer('ArrayExpression')
export class ArrayLiteralNode extends AbstractExpressionNode {
	static fromJSON(node: ArrayLiteralNode, deserializer: NodeDeserializer): ArrayLiteralNode {
		return new ArrayLiteralNode(node.elements.map(expression => deserializer(expression)));
	}
	constructor(private elements: ExpressionNode[]) {
		super();
	}
	getElements() {
		return this.elements;
	}
	set(stack: StackProvider) {
		throw new Error("LiteralArrayNode#set() has no implementation.");
	}
	get(stack: StackProvider) {
		return this.elements.map(item => item.get(stack));
	}
	entry(): string[] {
		return this.elements.flatMap(item => item.entry());
	}
	event(parent?: string): string[] {
		return this.elements.flatMap(item => item.event());
	}
	toString() {
		return this.elements.map(item => item.toString()).toString();
	}
	toJson(): object {
		return {
			elements: this.elements.map(item => item.toJSON())
		};
	}
}
