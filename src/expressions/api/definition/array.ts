import type { NodeDeserializer, ExpressionNode } from '../expression.js';
import { AbstractExpressionNode } from '../abstract.js';
import { Deserializer } from '../deserialize/deserialize.js';
import { StackProvider } from '../scope.js';

@Deserializer('array')
export class ArrayLiteralNode extends AbstractExpressionNode {
	static fromJSON(node: ArrayLiteralNode, deserializer: NodeDeserializer): ArrayLiteralNode {
		return new ArrayLiteralNode(node.items.map(expression => deserializer(expression)));
	}
	constructor(private items: ExpressionNode[]) {
		super();
	}
	getItems() {
		return this.items;
	}
	set(stack: StackProvider) {
		throw new Error("LiteralArrayNode#set() has no implementation.");
	}
	get(stack: StackProvider) {
		return this.items.map(item => item.get(stack));
	}
	entry(): string[] {
		return this.items.flatMap(item => item.entry());
	}
	event(parent?: string): string[] {
		return this.items.flatMap(item => item.event());
	}
	toString() {
		return this.items.map(item => item.toString()).toString();
	}
	toJson(): object {
		return {
			items: this.items.map(item => item.toJSON())
		};
	}
}
