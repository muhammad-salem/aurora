import type { NodeDeserializer, ExpressionNode } from '../expression.js';
import type { Stack } from '../../scope/stack.js';
import { Deserializer } from '../deserialize/deserialize.js';
import { AbstractExpressionNode, AwaitPromise } from '../abstract.js';


@Deserializer('AwaitExpression')
export class AwaitExpression extends AbstractExpressionNode {
	static fromJSON(node: AwaitExpression, serializer: NodeDeserializer): AwaitExpression {
		return new AwaitExpression(serializer(node.argument));
	}
	constructor(private argument: ExpressionNode) {
		super();
	}
	getArgument() {
		return this.argument;
	}
	set(stack: Stack, value: any) {
		throw new Error('AwaitExpression#set() has no implementation.');
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
