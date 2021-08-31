import type { NodeDeserializer, ExpressionNode, CanDeclareVariable } from '../expression.js';
import type { Stack } from '../../scope/stack.js';
import type { ScopeType } from '../../scope/scope.js';
import { AbstractExpressionNode } from '../abstract.js';
import { Deserializer } from '../deserialize/deserialize.js';

@Deserializer('Property')
export class Property extends AbstractExpressionNode implements CanDeclareVariable {
	static fromJSON(node: Property, deserializer: NodeDeserializer): Property {
		return new Property(deserializer(node.key), deserializer(node.value), node.kind);
	}
	constructor(protected key: ExpressionNode, protected value: ExpressionNode, protected kind: 'init' | 'get' | 'set') {
		super();
	}
	getKey() {
		return this.key;
	}
	getValue() {
		return this.value;
	}
	set(stack: Stack, value: any) {
		this.key.set(stack, value);
	}
	get(stack: Stack, thisContext: ThisType<any>): any {
		const name = this.key.get(stack);
		let value: any;
		switch (this.kind) {
			case 'get':
				const get: () => any = this.value.get(stack);
				Object.defineProperty(thisContext, name, { get, configurable: true, enumerable: true });
				value = get;
				break;
			case 'set':
				const set: (v: any) => void = this.value.get(stack);
				Object.defineProperty(thisContext, name, { set, configurable: true, enumerable: true });
				value = set;
				break;
			default:
			case 'init':
				value = this.value.get(stack);
				Object.defineProperty(thisContext, name, { value, configurable: true, enumerable: true, writable: true });
				break;
		}
		return value;
	}
	declareVariable(stack: Stack, scopeType: ScopeType, objectValue: any): void {
		const propertyName = this.key.get(stack);
		const propertyValue = objectValue[propertyName];
		(this.value as ExpressionNode & CanDeclareVariable).declareVariable(stack, scopeType, propertyValue);
	}
	entry(): string[] {
		return this.key.entry().concat(this.value.entry());
	}
	event(): string[] {
		return this.key.event().concat(this.value.event());
	}
	toString(): string {
		return `${this.key.toString()}: ${this.value.toString()}`;
	}
	toJson(): object {
		return {
			key: this.key.toJSON(),
			value: this.value.toJSON(),
			kind: this.kind
		};
	}
}

@Deserializer('ObjectExpression')
export class ObjectExpression extends AbstractExpressionNode {
	static fromJSON(node: ObjectExpression, deserializer: NodeDeserializer): ObjectExpression {
		return new ObjectExpression(node.properties.map(deserializer));
	}
	constructor(private properties: ExpressionNode[]) {
		super();
	}
	getProperties() {
		return this.properties;
	}
	set(stack: Stack) {
		throw new Error('ObjectExpression#set() has no implementation.');
	}
	get(stack: Stack) {
		const newObject = {};
		for (const property of this.properties) {
			property.get(stack, newObject);
		}
		return newObject;
	}
	entry(): string[] {
		return this.properties.flatMap(property => property.entry());
	}
	event(parent?: string): string[] {
		return this.properties.flatMap(property => property.event());
	}
	toString() {
		return `{ ${this.properties.map(item => item.toString()).join(', ')} }`;
	}
	toJson(): object {
		return {
			properties: this.properties.map(item => item.toJSON())
		};
	}
}

@Deserializer('ObjectPattern')
export class ObjectPattern extends AbstractExpressionNode implements CanDeclareVariable {
	static fromJSON(node: ObjectPattern, deserializer: NodeDeserializer): ObjectPattern {
		return new ObjectPattern(node.properties.map(deserializer));
	}
	constructor(private properties: ExpressionNode[]) {
		super();
	}
	getProperties() {
		return this.properties;
	}
	set(stack: Stack, objectValue: any) {
		throw new Error('ObjectPattern#set() has no implementation.');
	}
	get(scopeProvider: Stack, objectValue: any) {
		this.declareVariable(scopeProvider, 'block', objectValue);
	}
	declareVariable(stack: Stack, scopeType: ScopeType, objectValue: any): void {
		for (const property of this.properties as Property[]) {
			property.declareVariable(stack, scopeType, objectValue);
		}
	}
	entry(): string[] {
		return this.properties.flatMap(property => property.entry());
	}
	event(parent?: string): string[] {
		return this.properties.flatMap(property => property.event());
	}
	toString() {
		return `{ ${this.properties.map(item => item.toString()).join(', ')} }`;
	}
	toJson(): object {
		return {
			properties: this.properties.map(item => item.toJSON())
		};
	}
}
