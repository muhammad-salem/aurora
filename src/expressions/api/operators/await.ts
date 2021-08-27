import type { NodeDeserializer, ExpressionNode } from '../expression.js';
import type { Stack } from '../../scope/stack.js';
import { Deserializer } from '../deserialize/deserialize.js';
import { AbstractExpressionNode, AwaitPromise } from '../abstract.js';


@Deserializer('AwaitExpression')
export class AwaitExpressionNode extends AbstractExpressionNode {
	static fromJSON(node: AwaitExpressionNode, serializer: NodeDeserializer): AwaitExpressionNode {
		return new AwaitExpressionNode(serializer(node.argument));
	}
	constructor(private argument: ExpressionNode) {
		super();
	}
	getArgument() {
		return this.argument;
	}
	set(stack: Stack, value: any) {
		throw new Error('AwaitExpressionNode#set() has no implementation.');
	}
	entry(): string[] {
		return this.argument.entry();
	}
	event(parent?: string): string[] {
		return this.argument.event(parent);
	}
	get(stack: Stack, thisContext?: any) {
		const promise = this.argument.get(stack);
		return new AwaitPromise(promise);
	}
	toString() {
		return `await ${this.argument.toString()}`;
	}
	toJson(): object {
		return {
			argument: this.argument.toJSON()
		};
	}
}
