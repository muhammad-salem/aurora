import type { NodeDeserializer, ExpressionNode } from '../expression.js';
import { AbstractExpressionNode } from '../abstract.js';
import { Deserializer } from '../deserialize/deserialize.js';
import { ScopedStack } from '../scope.js';

export type ChainingType = 'property' | 'expression' | 'function';
@Deserializer('chaining')
export class OptionalChainingNode extends AbstractExpressionNode {
	static fromJSON(node: OptionalChainingNode, deserializer: NodeDeserializer): OptionalChainingNode {
		return new OptionalChainingNode(
			deserializer(node.optional),
			deserializer(node.property),
			node.type
		);
	}
	static KEYWORDS = ['?.'];
	constructor(private optional: ExpressionNode, private property: ExpressionNode, private type: ChainingType) {
		super();
	}
	getOptional() {
		return this.optional;
	}
	getProperty() {
		return this.property;
	}
	getType() {
		return this.type;
	}
	set(stack: ScopedStack, value: any) {
		throw new Error(`OptionalChainingNode.#set() has no implementation.`)
	}
	get(stack: ScopedStack, thisContext?: any) {
		const object = this.optional.get(thisContext ? stack.stackFor(thisContext) : stack);
		if (object === null || object === undefined) {
			return undefined
		}
		switch (this.type) {
			case 'property':
				return (<ExpressionNode>this.property).get(stack, object);
			case 'expression':
				return object[(<ExpressionNode>this.property).get(stack, object)];
			case 'function':
				return (<ExpressionNode>this.property).get(stack, object);
		}
	}
	getThis(stack: ScopedStack): any {
		return this.optional.get(stack);
	}
	entry(): string[] {
		return [...this.optional.entry(), ...this.property.entry()];
	}
	event(parent?: string): string[] {
		return [];
	}
	toString() {
		return `${this.optional.toString()}?.${this.property.toString()}`;
	}
	toJson(): object {
		return {
			optional: this.optional.toJSON(),
			property: this.property.toJSON(),
			type: this.type
		};
	}
}
