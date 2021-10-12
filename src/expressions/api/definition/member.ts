import type { NodeDeserializer, ExpressionNode, CanFindScope, DependencyVariables } from '../expression.js';
import type { Scope } from '../../scope/scope.js';
import type { Stack } from '../../scope/stack.js';
import { Deserializer } from '../deserialize/deserialize.js';
import { AbstractExpressionNode } from '../abstract.js';

@Deserializer('MemberExpression')
export class MemberExpression extends AbstractExpressionNode implements CanFindScope {
	static fromJSON(node: MemberExpression, deserializer: NodeDeserializer): MemberExpression {
		return new MemberExpression(
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
	set(stack: Stack, value: any) {
		const objectScope = (this.object as ExpressionNode & CanFindScope).findScope(stack);
		let propertyKey: PropertyKey;
		if (this.computed) {
			propertyKey = this.property.get(stack);
			objectScope.set(propertyKey, value);
		} else {
			stack.pushScope(objectScope);
			this.property.set(stack, value);
			stack.clearTo(objectScope);
		}
		return value;
	}
	get(stack: Stack, thisContext?: any) {
		const objectRef = thisContext ?? this.object.get(stack);
		if (objectRef === undefined || objectRef === null) {
			if (this.optional) {
				return;
			}
			throw new TypeError(`Cannot read property '${this.property.toString()}' of ${objectRef}`);
		}
		let value;
		if (this.computed) {
			value = objectRef[this.property.get(stack)];
		} else {
			value = this.property.get(stack, objectRef);
		}
		return value;
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
			return `${this.object.toString()}${this.optional ? '?.' : ''}[${this.property.toString()}]`;
		}
		return `${this.object.toString()}${this.optional ? '?.' : '.'}${this.property.toString()}`;
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
