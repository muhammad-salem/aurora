import type { NodeDeserializer, ExpressionNode } from '../expression.js';
import type { ScopedStack } from '../scope.js';
import { AbstractExpressionNode, ReturnValue } from '../abstract.js';
import { Deserializer } from '../deserialize/deserialize.js';

/**
 * The expression whose value is to be returned. 
 * If omitted, undefined is returned instead.
 */
@Deserializer('return')
export class ReturnNode extends AbstractExpressionNode {
	static fromJSON(node: ReturnNode, deserializer: NodeDeserializer): ReturnNode {
		return new ReturnNode(node.node ? deserializer(node.node) : void 0);
	}
	constructor(private node?: ExpressionNode) {
		super();
	}
	getNode() {
		return this.node;
	}
	set(stack: ScopedStack, value: any) {
		throw new Error(`ReturnNode#set() has no implementation.`);
	}
	get(stack: ScopedStack) {
		return new ReturnValue(this.node?.get(stack));
		// nothing should be written after this operation in a function body.
	}
	entry(): string[] {
		return this.node?.entry() || [];
	}
	event(parent?: string): string[] {
		return this.node?.event(parent) || [];
	}
	toString(): string {
		return `return ${this.node?.toString() || ''}`;
	}
	toJson(): object {
		return { node: this.node?.toJSON() };
	}
}
