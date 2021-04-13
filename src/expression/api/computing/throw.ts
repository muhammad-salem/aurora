import type { NodeDeserializer, ExpressionNode } from '../expression.js';
import type { ScopedStack } from '../scope.js';
import { AbstractExpressionNode } from '../abstract.js';
import { Deserializer } from '../deserialize/deserialize.js';

/**
 * The expression whose value is to be returned. 
 * If omitted, undefined is returned instead.
 */
@Deserializer('throw')
export class ThrowExpressionNode extends AbstractExpressionNode {
	static fromJSON(node: ThrowExpressionNode, deserializer: NodeDeserializer): ThrowExpressionNode {
		return new ThrowExpressionNode(deserializer(node.exception));
	}
	constructor(private exception: ExpressionNode) {
		super();
	}
	getException() {
		return this.exception;
	}
	set(stack: ScopedStack, value: any) {
		throw new Error(`ReturnNode#set() has no implementation.`);
	}
	get(stack: ScopedStack) {
		throw this.exception.get(stack);
	}
	entry(): string[] {
		return [];
	}
	event(parent?: string): string[] {
		return [];
	}
	toString(): string {
		return `throw ${this.exception.toString()}`;
	}
	toJson(): object {
		return { exception: this.exception?.toJSON() };
	}
}
