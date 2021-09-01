import type { NodeDeserializer, ExpressionNode, CanFindScope } from '../expression.js';
import type { Scope } from '../../scope/scope.js';
import type { Stack } from '../../scope/stack.js';
import { AbstractExpressionNode } from '../abstract.js';
import { Deserializer } from '../deserialize/deserialize.js';

export type ChainingType = 'property' | 'expression' | 'function';
@Deserializer('ChainExpression')
export class ChainExpression extends AbstractExpressionNode implements CanFindScope {
	static fromJSON(node: ChainExpression, deserializer: NodeDeserializer): ChainExpression {
		return new ChainExpression(
			deserializer(node.optional),
			deserializer(node.property),
			node.type
		);
	}
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
	set(stack: Stack, value: any) {
		throw new Error(`ChainExpression.#set() has no implementation.`)
	}
	get(stack: Stack, thisContext?: any) {
		let value: any | Function;
		if (thisContext) {
			value = this.property.get(stack, thisContext);
		} else {
			const object = this.optional.get(stack);
			if (object === null || object === undefined) {
				return undefined
			}
			switch (this.type) {
				case 'property':
				case 'function':
					value = (<ExpressionNode>this.property).get(stack, object);
				case 'expression':
					value = object[(<ExpressionNode>this.property).get(stack, object)];
			}
			thisContext = object;
		}
		if (typeof value === 'function') {
			return (<Function>value).bind(thisContext);
		}
		return value;
	}
	findScope<T extends object>(stack: Stack): Scope<T>;
	findScope<T extends object>(stack: Stack, scope: Scope<any>): Scope<T>;
	findScope<T extends object>(stack: Stack, objectSCope?: Scope<any>): Scope<T> | undefined {
		if (!objectSCope) {
			objectSCope = (this.optional as ExpressionNode & CanFindScope).findScope(stack);
		}
		if (!objectSCope) {
			return;
		}
		return (this.property as ExpressionNode & CanFindScope).findScope(stack, objectSCope);
	}
	entry(): string[] {
		return [...this.optional.entry(), ...this.property.entry()];
	}
	event(parent?: string): string[] {
		return [...this.optional.event(), ...this.property.event()];
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
