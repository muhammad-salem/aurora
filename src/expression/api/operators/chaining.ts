import type { NodeDeserializer, ExpressionNode } from '../expression.js';
import { AbstractExpressionNode } from '../abstract.js';
import { Deserializer } from '../deserialize/deserialize.js';
import { ScopedStack } from '../scope.js';

export type ChainingType = 'access' | 'computed' | 'function';
@Deserializer('chaining')
export class OptionalChainingNode extends AbstractExpressionNode {

	static fromJSON(node: OptionalChainingNode, deserializer: NodeDeserializer): OptionalChainingNode {
		return new OptionalChainingNode(deserializer(node.optional), deserializer(node.property), node.type);
	}

	static KEYWORDS = ['?.'];

	constructor(private optional: ExpressionNode, private property: ExpressionNode, private type: ChainingType) {
		super();
	}

	set(stack: ScopedStack, value: any) {
		throw new Error(`OptionalChainingNode.#set() has no implementation.`)
	}

	get(stack: ScopedStack) {
		const object = this.optional.get(stack);
		if (object === null || object === undefined) {
			return undefined
		}
		switch (this.type) {
			case 'access':
				return this.property.get(stack.stackFor(object));
			case 'computed':
				return object[this.property.get(stack)];
			case 'function':
				return this.property.get(stack.stackFor(object));
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
