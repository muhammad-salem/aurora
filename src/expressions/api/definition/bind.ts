import type { NodeDeserializer, ExpressionNode, CanFindScope, DependencyVariables } from '../expression.js';
import type { Scope } from '../../scope/scope.js';
import type { Stack } from '../../scope/stack.js';
import { Deserializer } from '../deserialize/deserialize.js';
import { AbstractExpressionNode } from '../abstract.js';

/**
 * ```js
 * const x = {method: function(){...}};
 * const z = x::method;
 * ```
 */
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
	shareVariables(scopeList: Scope<any>[]): void { }
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
	events(): DependencyVariables {
		return this.object.events().concat(this.property.events());
	}
	toString() {
		if (this.computed) {
			return `${this.object.toString()}${this.optional ? '?::' : '::'}[${this.property.toString()}]`;
		}
		return `${this.object.toString()}${this.optional ? '?::' : '::'}${this.property.toString()}`;
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
