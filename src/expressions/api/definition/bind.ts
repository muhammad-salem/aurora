import type { NodeDeserializer, ExpressionNode, CanFindScope } from '../expression.js';
import type { Scope } from '../../scope/scope.js';
import type { Stack } from '../../scope/stack.js';
import { Deserializer } from '../deserialize/deserialize.js';
import { AbstractExpressionNode } from '../abstract.js';

@Deserializer('BindExpression')
export class BindExpression extends AbstractExpressionNode implements CanFindScope {
	static fromJSON(node: BindExpression, deserializer: NodeDeserializer): BindExpression {
		return new BindExpression(
			deserializer(node.object),
			deserializer(node.property),
			node.computed,
			node.optional
		);
	}
	constructor(
		protected object: ExpressionNode,
		protected property: ExpressionNode,
		private computed: boolean,
		private optional: boolean = false) {
		super();
	}
	getObject() {
		return this.object;
	}
	getProperty() {
		return this.property;
	}
	set(stack: Stack) {
		throw new Error("BindExpression#set() has no implementation.");
	}
	get(stack: Stack, thisContext?: any) {
		const objectRef = thisContext ?? this.object.get(stack);
		if (typeof objectRef === 'undefined') {
			throw new TypeError(`Cannot read property '${this.property.toString()}' of undefined`);
		}
		let value;
		if (this.computed) {
			value = objectRef[this.property.get(stack)];
		} else {
			value = this.property.get(stack, objectRef);
		}
		if (this.optional && (value === undefined || value === null)) {
			return;
		}
		if (typeof value !== 'function') {
			throw new Error(`can't bind to non-function type ${value}`);
		}
		return (<Function>value).bind(objectRef);
	}
	findScope<T extends object>(stack: Stack): Scope<T>;
	findScope<T extends object>(stack: Stack, scope: Scope<any>): Scope<T>;
	findScope<T extends object>(stack: Stack, objectScope?: Scope<any>): Scope<T> | undefined {
		if (!objectScope) {
			objectScope = (this.object as ExpressionNode & CanFindScope).findScope(stack);
		}
		return (this.property as ExpressionNode & CanFindScope).findScope(stack, objectScope);
	}
	events(parent?: string): string[] {
		if (this.computed) {
			parent ??= '';
			parent = `${parent}${this.object.events(parent)}`;
			return [parent, `${parent}[${this.property.toString()}]`];
		}
		parent ||= '';
		parent += this.object.toString() + '.';
		return [...this.object.events(), ...this.property.events(parent)];
	}
	toString() {
		if (this.computed) {
			return `${this.object.toString()}::[${this.property.toString()}]`;
		}
		return `${this.object.toString()}::${this.property.toString()}`;
	}
	toJson(): object {
		return {
			object: this.object.toJSON(),
			property: this.property.toJSON(),
			computed: this.computed,
			optional: this.optional
		};
	}
}
