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
			(Array.isArray(node.property)) ? node.property.map(deserializer) : deserializer(node.property),
			node.type
		);
	}
	static KEYWORDS = ['?.'];
	constructor(private optional: ExpressionNode, private property: ExpressionNode | ExpressionNode[], private type: ChainingType) {
		super();
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
				const func = object as Function;
				// expect property to be a ExpressionNode[]
				const parameters = (<ExpressionNode[]>this.property).map(prop => prop.get(stack));
				return func.call(thisContext, ...parameters);
		}
	}
	getThis(stack: ScopedStack): any {
		return this.optional.get(stack);
	}
	entry(): string[] {
		return [...this.optional.entry(), ...(Array.isArray(this.property)) ? this.property.flatMap(param => param.entry()) : this.property.entry()];
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
			property: (Array.isArray(this.property)) ? this.property.map(param => param.toJSON()) : this.property.toJSON(),
			type: this.type
		};
	}
}
