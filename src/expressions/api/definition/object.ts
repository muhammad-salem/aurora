import type {
	NodeDeserializer, ExpressionNode, DeclarationExpression,
	ExpressionEventPath, VisitNodeType
} from '../expression.js';
import type { Stack } from '../../scope/stack.js';
import { Identifier } from './values.js';
import { AbstractExpressionNode } from '../abstract.js';
import { Deserializer } from '../deserialize/deserialize.js';
import { RestElement } from '../computing/rest.js';
import { FunctionDeclaration } from './function.js';

@Deserializer('Property')
export class Property extends AbstractExpressionNode implements DeclarationExpression {
	static fromJSON(node: Property, deserializer: NodeDeserializer): Property {
		return new Property(
			deserializer(node.key),
			deserializer(node.value) as DeclarationExpression,
			node.kind,
			node.method,
			node.shorthand,
			node.computed,
		);
	}
	static visit(node: Property, visitNode: VisitNodeType): void {
		visitNode(node.key);
		visitNode(node.value);
	}
	constructor(
		protected key: ExpressionNode,
		protected value: DeclarationExpression | ExpressionNode,
		protected kind: 'init' | 'get' | 'set',
		protected method: boolean,
		protected shorthand: boolean,
		protected computed: boolean,) {
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
		const name = this.key instanceof Identifier ? this.key.getName() : this.key.get(stack);
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
	declareVariable(stack: Stack, objectValue: any): void {
		const propertyName = this.shorthand ? (this.key as Identifier).getName() : this.key.get(stack);
		const propertyValue = objectValue[propertyName];
		(this.value as DeclarationExpression).declareVariable(stack, propertyValue);
	}
	dependency(computed?: true): ExpressionNode[] {
		return this.key.dependency(computed).concat(this.value.dependency(computed));
	}
	dependencyPath(computed?: true): ExpressionEventPath[] {
		return this.key.dependencyPath(computed).concat(this.value.dependencyPath(computed));
	}
	toString(): string {
		const key = this.computed ? `[${this.key.toString()}]` : this.key.toString();
		if (this.shorthand) {
			return key;
		}
		let value = '';
		switch (this.kind) {
			case 'get':
			case 'set':
				const expression = (this.value as FunctionDeclaration);
				value += this.kind;
				value += ' ' + key
				value += expression.paramsAndBodyToString();
				break;
			case 'init':
				if (this.method) {
					const expression = (this.value as FunctionDeclaration);
					value += ' ' + key
					value += expression.paramsAndBodyToString();
				} else {
					value += this.value.toString();
					return `${key}: ${value}`;
				}
				break;
			default:
				break;
		}
		return value;
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
	static visit(node: ObjectExpression, visitNode: VisitNodeType): void {
		node.properties.forEach(visitNode);
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
export class ObjectPattern extends AbstractExpressionNode implements DeclarationExpression {
	static fromJSON(node: ObjectPattern, deserializer: NodeDeserializer): ObjectPattern {
		return new ObjectPattern(node.properties.map(deserializer) as (Property | RestElement)[]);
	}
	static visit(node: ObjectPattern, visitNode: VisitNodeType): void {
		node.properties.forEach(visitNode);
	}
	constructor(private properties: (Property | RestElement)[]) {
		super();
	}
	getProperties() {
		return this.properties;
	}
	set(stack: Stack, objectValue: any) {
		throw new Error('ObjectPattern#set() has no implementation.');
	}
	get(scopeProvider: Stack) {
		throw new Error('ObjectPattern#get() has no implementation.');
	}
	declareVariable(stack: Stack, objectValue: any): void {
		for (const property of this.properties) {
			if (property instanceof RestElement) {
				objectValue = this.getFromObject(stack, objectValue);
			}
			property.declareVariable(stack, objectValue);
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
