import type { Stack } from '../../scope/stack.js';
import type { ScopeType } from '../../scope/scope.js';
import type { CanDeclareVariable, ExpressionNode, NodeDeserializer } from '../expression.js';
import { AbstractExpressionNode } from '../abstract.js';
import { Deserializer } from '../deserialize/deserialize.js';
import { Identifier } from '../definition/values.js';
import { MemberExpression } from '../definition/member.js';
import { FunctionExpression } from '../definition/function.js';


/**
 * MetaProperty node represents
 * - `new.target` meta property in ES2015.
 * - `import.meta` meta property in ES2030.
 * 
 * In the future, it will represent other meta properties as well.
 */
@Deserializer('MetaProperty')
export class MetaProperty extends MemberExpression {

	public static NewTarget = new MetaProperty(new Identifier('new'), new Identifier('target'));

	public static ImportMeta = new MetaProperty(new Identifier('import'), new Identifier('meta'));

	private static getJsonName(identifier: ExpressionNode): string {
		return Reflect.get(identifier, 'name');
	}

	static fromJSON(node: MetaProperty, deserializer: NodeDeserializer<any>): MetaProperty {
		if (MetaProperty.getJsonName(node.meta) === 'new' && MetaProperty.getJsonName(node.property) === 'target') {
			return MetaProperty.NewTarget;
		}
		else if (MetaProperty.getJsonName(node.meta) === 'new' && MetaProperty.getJsonName(node.property) === 'meta') {
			return MetaProperty.ImportMeta;
		}
		return new MetaProperty(
			deserializer(node.meta),
			deserializer(node.property)
		);
	}
	constructor(private meta: Identifier, property: Identifier) {
		super(meta, property, false);
	}
	getMeta() {
		return this.meta;
	}
	toString(): string {
		return `${this.meta.toString()}.${this.property.toString()}`;
	}
	toJson(key?: string): { [key: string]: any; } {
		return {
			meta: this.meta.toJSON(),
			property: this.property.toJSON(),
		};
	}
}

/**
 * A private identifier refers to private class elements. For a private name #a, its name is a.
 */
@Deserializer('PrivateIdentifier')
export class PrivateIdentifier extends Identifier {
	static fromJSON(node: PrivateIdentifier): PrivateIdentifier {
		return new PrivateIdentifier(
			node.name as string
		);
	}
	constructor(private privateName: string) {
		super('ɵ_' + privateName);
	}
	toString(): string {
		return `#${this.privateName}`;
	}
	toJson(key?: string): { [key: string]: any; } {
		return {
			name: this.privateName
		};
	}
}

export type MethodDefinitionKind = 'constructor' | 'method' | 'set' | 'get';

/**
 * - When key is a PrivateIdentifier, computed must be false and kind can not be "constructor".
 */
@Deserializer('MethodDefinition')
export class MethodDefinition extends AbstractExpressionNode implements CanDeclareVariable {
	static fromJSON(node: MethodDefinition, deserializer: NodeDeserializer<any>): MethodDefinition {
		return new MethodDefinition(
			node.kind,
			deserializer(node.key),
			deserializer(node.value),
			node.computed,
			node.static
		);
	}
	private 'static': boolean;
	constructor(
		private kind: MethodDefinitionKind,
		private key: ExpressionNode | PrivateIdentifier,
		private value: FunctionExpression,

		private computed: boolean,
		isStatic: boolean) {
		super();
		this.static = isStatic;
	}
	getKind() {
		return this.kind;
	}
	getKey() {
		return this.key;
	}
	getValue() {
		return this.value;
	}
	isComputed() {
		return this.computed;
	}
	isStatic() {
		return this.static;
	}
	set(stack: Stack, value: any) {
		throw new Error('Method not implemented.');
	}
	get(stack: Stack, thisContext?: any) {
		throw new Error('Method not implemented.');
	}
	declareVariable(stack: Stack, scopeType: ScopeType, propertyValue?: any) {
		throw new Error('Method not implemented.');
	}
	events(parent?: string): string[] {
		throw new Error('Method not implemented.');
	}
	toString(): string {
		throw new Error('Method not implemented.');
	}
	toJson(key?: string): { [key: string]: any; } {
		return {
			kind: this.kind,
			key: this.key,
			value: this.value,
			computed: this.computed,
			static: this.static,
		};
	}
}



/**
 * - When key is a PrivateIdentifier, computed must be false.
 */
@Deserializer('PropertyDefinition')
export class PropertyDefinition extends AbstractExpressionNode implements CanDeclareVariable {
	static fromJSON(node: PropertyDefinition, deserializer: NodeDeserializer<any>): PropertyDefinition {
		return new PropertyDefinition(
			deserializer(node.key),
			node.computed,
			node.static,
			node.value && deserializer(node.value)
		);
	}
	private 'static': boolean;
	constructor(
		private key: ExpressionNode | PrivateIdentifier,
		private computed: boolean,
		isStatic: boolean,
		private value?: ExpressionNode) {
		super();
		this.static = isStatic;
	}
	getKey() {
		return this.key;
	}
	getValue() {
		return this.value;
	}
	isComputed() {
		return this.computed;
	}
	isStatic() {
		return this.static;
	}
	set(stack: Stack, value: any) {
		throw new Error('Method not implemented.');
	}
	get(stack: Stack, thisContext?: any) {
		throw new Error('Method not implemented.');
	}
	declareVariable(stack: Stack, scopeType: ScopeType, propertyValue?: any) {
		throw new Error('Method not implemented.');
	}
	events(parent?: string): string[] {
		throw new Error('Method not implemented.');
	}
	toString(): string {
		throw new Error('Method not implemented.');
	}
	toJson(key?: string): { [key: string]: any; } {
		return {
			key: this.key.toJSON(),
			computed: this.computed,
			static: this.static,
			value: this.value?.toJSON()
		};
	}
}

@Deserializer('ClassBody')
export class ClassBody extends AbstractExpressionNode {
	static fromJSON(node: ClassBody, deserializer: NodeDeserializer<any>): ClassBody {
		return new ClassBody(
			node.body.map(deserializer)
		);
	}
	constructor(private body: (MethodDefinition | PropertyDefinition)[]) {
		super();
	}
	getBody() {
		return this.body;
	}
	set(stack: Stack, value: any) {
		throw new Error('Method not implemented.');
	}
	get(stack: Stack, thisContext?: any) {
		throw new Error('Method not implemented.');
	}
	events(parent?: string): string[] {
		throw new Error('Method not implemented.');
	}
	toString(): string {
		throw new Error('Method not implemented.');
	}
	toJson(key?: string): { [key: string]: any; } {
		return {
			body: this.body.map(method => method.toJSON())
		};
	}
}

export class Class extends AbstractExpressionNode {
	constructor(
		protected body: ClassBody,
		protected id?: Identifier,
		protected superClass?: ExpressionNode) {
		super();
	}
	getBody() {
		return this.body;
	}
	getId() {
		return this.id;
	}
	getSuperClass() {
		return this.superClass;
	}

	set(stack: Stack) {
		throw new Error(`Class.#set() has no implementation.`);
	}
	get(stack: Stack) {
		throw new Error(`Class.#get() has no implementation.`);
	}
	events(parent?: string): string[] {
		return [];
	}
	toString() {
		let classDeclaration = 'class ';
		if (this.id) {
			classDeclaration += this.id.toString();
		}
		if (this.superClass) {
			classDeclaration += ' extends ' + this.superClass.toString();
		}
		return `${classDeclaration} {${this.body.toString()}\n`;
	}
	toJson(): object {
		return {
			body: this.body.toJSON(),
			id: this.id?.toJSON(),
			superClass: this.superClass?.toJSON(),
		};
	}
}

@Deserializer('ClassDeclaration')
export class ClassDeclaration extends Class implements CanDeclareVariable {
	static fromJSON(node: ClassDeclaration, deserializer: NodeDeserializer<any>): ClassDeclaration {
		return new ClassDeclaration(
			deserializer(node.body),
			deserializer(node.id),
			node.superClass && deserializer(node.superClass)
		);
	}
	protected id: Identifier;
	declareVariable(stack: Stack, scopeType: ScopeType, propertyValue?: any) {
		stack.declareVariable(scopeType, this.id.getName(), propertyValue);
	}
}

@Deserializer('ClassExpression')
export class ClassExpression extends Class {
	static fromJSON(node: ClassExpression, deserializer: NodeDeserializer<any>): ClassExpression {
		return new ClassExpression(
			deserializer(node.body),
			node.id && deserializer(node.id),
			node.superClass && deserializer(node.superClass)
		);
	}
}
