import type { NodeDeserializer, ExpressionNode } from '../expression.js';
import type { Stack } from '../../scope/stack.js';
import { AbstractExpressionNode, ReturnValue } from '../abstract.js';
import { Deserializer } from '../deserialize/deserialize.js';

/**
 * The expression whose value is to be returned. 
 * If omitted, undefined is returned instead.
 */
@Deserializer('ReturnStatement')
export class ReturnStatement extends AbstractExpressionNode {
	static fromJSON(node: ReturnStatement, deserializer: NodeDeserializer): ReturnStatement {
		return new ReturnStatement(node.argument ? deserializer(node.argument) : void 0);
	}
	constructor(private argument?: ExpressionNode) {
		super();
	}
	getArgument() {
		return this.argument;
	}
	set(stack: Stack, value: any) {
		throw new Error(`ReturnStatement#set() has no implementation.`);
	}
	get(stack: Stack) {
		return new ReturnValue(this.argument?.get(stack));
		// nothing should be written after this operation in a function body.
	}
	entry(): string[] {
		return this.argument?.entry() || [];
	}
	event(parent?: string): string[] {
		return this.argument?.event(parent) || [];
	}
	toString(): string {
		return `return ${this.argument?.toString() || ''}`;
	}
	toJson(): object {
		return { argument: this.argument?.toJSON() };
	}
}
