import type { NodeDeserializer, ExpressionNode } from '../expression.js';
import type { Stack } from '../../scope/stack.js';
import { Deserializer } from '../deserialize/deserialize.js';
import { AbstractExpressionNode } from '../abstract.js';

@Deserializer('MemberExpression')
export class MemberExpression extends AbstractExpressionNode {
	static fromJSON(node: MemberExpression, deserializer: NodeDeserializer): MemberExpression {
		return new MemberExpression(deserializer(node.object), deserializer(node.property), node.computed);
	}
	constructor(protected object: ExpressionNode, protected property: ExpressionNode, private computed: boolean) {
		super();
	}
	getObject() {
		return this.object;
	}
	getProperty() {
		return this.property;
	}
	set(stack: Stack, value: any) {
		const objectContext = this.object.get(stack);
		if (this.computed) {
			const propertyKey = this.property.get(stack);
			return objectContext[propertyKey] = value;
		}
		const objectScope = stack.pushBlockScopeFor(objectContext);
		const result = this.property.set(stack, value);
		stack.clearTo(objectScope);
		return result;
	}
	get(stack: Stack, thisContext?: any) {
		if (this.computed) {
			const thisRef = thisContext ?? this.object.get(stack);
			const value = thisRef[this.property.get(stack)];
			if (typeof value === 'function') {
				return (<Function>value).bind(thisRef);
			}
			return value;
		}
		const thisRef = thisContext ?? this.object.get(stack);
		const value = this.property.get(stack, thisRef);
		if (typeof value === 'function') {
			return (<Function>value).bind(thisRef);
		}
		return value;
	}
	event(parent?: string): string[] {
		if (this.computed) {
			parent ??= '';
			parent = `${parent}${this.object.event(parent)}`;
			return [parent, `${parent}[${this.property.toString()}]`];
		}
		parent ||= '';
		parent += this.object.toString() + '.';
		return [...this.object.event(), ...this.property.event(parent)];
	}
	entry(): string[] {
		return this.object.entry();
	}
	toString() {
		if (this.computed) {
			return `${this.object.toString()}[${this.property.toString()}]`;
		}
		return `${this.object.toString()}.${this.property.toString()}`;
	}
	toJson(): object {
		return {
			object: this.object.toJSON(),
			property: this.property.toJSON(),
			computed: this.computed
		};
	}
}
