import type { NodeDeserializer, ExpressionNode, CanDeclareExpression, ExpressionEventPath } from '../expression.js';
import type { Scope, ScopeType } from '../../scope/scope.js';
import type { Stack } from '../../scope/stack.js';
import { AbstractExpressionNode } from '../abstract.js';
import { Deserializer } from '../deserialize/deserialize.js';
import { RestElement } from '../computing/rest.js';

@Deserializer('Property')
export class Property extends AbstractExpressionNode implements CanDeclareExpression {
	static fromJSON(node: Property, deserializer: NodeDeserializer): Property {
		return new Property(deserializer(node.key), deserializer(node.value) as CanDeclareExpression, node.kind);
	}
	constructor(protected key: ExpressionNode, protected value: CanDeclareExpression | ExpressionNode, protected kind: 'init' | 'get' | 'set') {
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
	shareVariables(scopeList: Scope<any>[]): void {
		this.value.shareVariables(scopeList);
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
		(this.value as CanDeclareExpression).declareVariable(stack, scopeType, propertyValue);
	}
	dependency(computed?: true): ExpressionNode[] {
		return this.key.dependency(computed).concat(this.value.dependency(computed));
	}
	dependencyPath(computed?: true): ExpressionEventPath[] {
		return this.key.dependencyPath(computed).concat(this.value.dependencyPath(computed));
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
		return new ObjectExpression(node.properties.map(deserializer) as Property[]);
	}
	constructor(private properties: Property[]) {
		super();
	}
	getProperties() {
		return this.properties;
	}
	set(stack: Stack) {
		throw new Error('ObjectExpression#set() has no implementation.');
	}
	shareVariables(scopeList: Scope<any>[]): void {
		this.properties.forEach(prop => prop.shareVariables(scopeList));
	}
	get(stack: Stack) {
		const newObject = {};
		for (const property of this.properties) {
			property.get(stack, newObject);
		}
		return newObject;
	}
	dependency(computed?: true): ExpressionNode[] {
		return this.properties.flatMap(property => property.dependency(computed));
	}
	dependencyPath(computed?: true): ExpressionEventPath[] {
		return this.properties.flatMap(property => property.dependencyPath(computed));
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
export class ObjectPattern extends AbstractExpressionNode implements CanDeclareExpression {
	static fromJSON(node: ObjectPattern, deserializer: NodeDeserializer): ObjectPattern {
		return new ObjectPattern(node.properties.map(deserializer) as (Property | RestElement)[]);
	}
	constructor(private properties: (Property | RestElement)[]) {
		super();
	}
	getProperties() {
		return this.properties;
	}
	shareVariables(scopeList: Scope<any>[]): void { }
	set(stack: Stack, objectValue: any) {
		throw new Error('ObjectPattern#set() has no implementation.');
	}
	get(scopeProvider: Stack) {
		throw new Error('ObjectPattern#get() has no implementation.');
	}
	declareVariable(stack: Stack, scopeType: ScopeType, objectValue: any): void {
		for (const property of this.properties) {
			if (property instanceof RestElement) {
				objectValue = this.getFromObject(stack, objectValue);
			}
			property.declareVariable(stack, scopeType, objectValue);
		}
	}
	private getFromObject(stack: Stack, objectValue: { [key: PropertyKey]: any }) {
		const keys: PropertyKey[] = [];
		keys.push(...Object.keys(objectValue));
		keys.push(...Object.getOwnPropertySymbols(objectValue));
		const restObject: typeof objectValue = {};
		const context = stack.lastScope<typeof objectValue>().getContext()!;
		for (const key of keys) {
			if (!(key in context)) {
				restObject[key] = objectValue[key];
			}
		}
		return restObject;
	}
	dependency(computed?: true): ExpressionNode[] {
		return this.properties.flatMap(property => property.dependency(computed));
	}
	dependencyPath(computed?: true): ExpressionEventPath[] {
		return this.properties.flatMap(property => property.dependencyPath(computed));
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
