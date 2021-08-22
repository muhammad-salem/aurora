import type { NodeDeserializer, ExpressionNode } from '../expression';
import type { StackProvider } from '../scope';
import { Deserializer } from '../deserialize/deserialize';
import { AbstractExpressionNode, AwaitPromise } from '../abstract';


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
	set(stack: StackProvider, value: any) {
		throw new Error('AwaitExpressionNode#set() has no implementation.');
	}
	entry(): string[] {
		return this.argument.entry();
	}
	event(parent?: string): string[] {
		return this.argument.event(parent);
	}
	get(stack: StackProvider, thisContext?: any) {
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
