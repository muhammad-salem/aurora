import type {
	CanDeclareExpression, ExpressionEventPath,
	ExpressionNode, NodeDeserializer
} from '../expression.js';
import type { Scope, ScopeType } from '../../scope/scope.js';
import { Stack } from '../../scope/stack.js';
import { AbstractExpressionNode, ReturnValue } from '../abstract.js';
import { Deserializer } from '../deserialize/deserialize.js';
import { Identifier } from '../definition/values.js';
import { MemberExpression } from '../definition/member.js';
import { FunctionExpression } from '../definition/function.js';
import { BlockStatement } from '../statement/control/block.js';
import { TypeOf } from '../utils.js';
import { CallExpression } from '../index.js';


/**
 * A `super` pseudo-expression.
 */
@Deserializer('Super')
export class Super extends AbstractExpressionNode {
	static INSTANCE = new Super();
	static fromJSON(node: Super): Super {
		return Super.INSTANCE;
	}
	constructor() {
		super();
	}
	shareVariables(scopeList: Scope<any>[]): void { }
	set(stack: Stack, value: any) {
		throw new Error('Super.#set() Method not implemented.');
	}
	get(stack: Stack, thisContext?: any) {
		throw new Error('Super.#get() Method not implemented.');
	}
	dependency(computed?: true): ExpressionNode[] {
		throw new Error('Super.#dependency() Method not implemented.');
	}
	dependencyPath(computed?: true): ExpressionEventPath[] {
		throw new Error('Super.#dependencyPath() Method not implemented.');
	}

	toString(): string {
		return `super`;
	}
	toJson(): { [key: string]: any; } {
		return {};
	}
}

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
	shareVariables(scopeList: Scope<any>[]): void { }
	toString(): string {
		return `${this.meta.toString()}.${this.property.toString()}`;
	}
	toJson(): { [key: string]: any; } {
		return {
			meta: this.meta.toJSON(),
			property: this.property.toJSON(),
		};
	}
}

/**
 * A private identifier refers to private class elements. For a private name `#a`, its name is `a`.
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
	shareVariables(scopeList: Scope<any>[]): void { }
	toString(): string {
		return `#${this.privateName}`;
	}
	toJson(): { [key: string]: any; } {
		return {
			name: this.privateName
		};
	}
}

/**
 * A static block static { } is a block statement serving as an additional static initializer.
 */
@Deserializer('StaticBlock')
export class StaticBlock extends BlockStatement {
	static fromJSON(node: StaticBlock, deserializer: NodeDeserializer<any>): StaticBlock {
		return new StaticBlock(deserializer(node.body), node.isStatement);
	}
	constructor(body: ExpressionNode[], isStatement: boolean) {
		super(body, isStatement);
	}
	toString(): string {
		return `static ${super.toString()}`;
	}
}

export type MethodDefinitionKind = 'constructor' | 'method' | 'set' | 'get';

/**
 * - When key is a PrivateIdentifier, computed must be false and kind can not be "constructor".
 */
@Deserializer('MethodDefinition')
export class MethodDefinition extends AbstractExpressionNode implements CanDeclareExpression {
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
	shareVariables(scopeList: Scope<any>[]): void { }
	set(stack: Stack, value: any) {
		throw new Error('MethodDefinition.#set() Method not implemented.');
	}
	get(stack: Stack, thisContext?: any) {
		throw new Error('MethodDefinition.#get() Method not implemented.');
	}
	declareVariable(stack: Stack, scopeType: ScopeType, propertyValue?: any) {
		throw new Error('MethodDefinition.#declareVariable() Method not implemented.');
	}
	dependency(computed?: true): ExpressionNode[] {
		throw new Error('MethodDefinition.#dependency() Method not implemented.');
	}
	dependencyPath(computed?: true): ExpressionEventPath[] {
		throw new Error('MethodDefinition.#get() Method not implemented.');
	}
	toString(): string {
		let str = '';
		let name = this.computed ? `[${this.key.toString()}]` : this.key.toString();
		switch (this.kind) {
			case 'constructor':
				str += 'constructor ';
				break;
			case 'get':
				str += `get ${name} `;
				break;
			case 'set':
				str += `set ${name} `;
				break
			default:
				str = `${name} `;
				break;
		}
		str += this.value.toString();
		return str;
	}
	toJson(): { [key: string]: any; } {
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
export class PropertyDefinition extends AbstractExpressionNode implements CanDeclareExpression {
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
	shareVariables(scopeList: Scope<any>[]): void { }
	set(stack: Stack, value: any) {
		throw new Error('PropertyDefinition.#set() Method not implemented.');
	}
	get(stack: Stack, thisContext?: any) {
		throw new Error('PropertyDefinition.#get() Method not implemented.');
	}
	declareVariable(stack: Stack, scopeType: ScopeType, propertyValue?: any) {
		throw new Error('PropertyDefinition.#declareVariable() Method not implemented.');
	}
	dependency(computed?: true): ExpressionNode[] {
		throw new Error('PropertyDefinition.#dependency() Method not implemented.');
	}
	dependencyPath(computed?: true): ExpressionEventPath[] {
		throw new Error('PropertyDefinition.#dependencyPath() Method not implemented.');
	}
	toString(): string {
		const name = this.computed ? `[${this.key.toString()}]` : this.key.toString();
		if (this.value) {
			return `${name} = ${this.value.toString()};`
		}
		return `${name};`
	}
	toJson(): { [key: string]: any; } {
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
	constructor(private body: (MethodDefinition | PropertyDefinition | StaticBlock)[]) {
		super();
	}
	getBody() {
		return this.body;
	}
	shareVariables(scopeList: Scope<any>[]): void { }
	set(stack: Stack, value: any) {
		throw new Error('Method not implemented.');
	}
	get(stack: Stack, thisContext?: any) {
		throw new Error('Method not implemented.');
	}
	dependency(computed?: true): ExpressionNode[] {
		throw new Error('Method not implemented.');
	}
	dependencyPath(computed?: true): ExpressionEventPath[] {
		throw new Error('Method not implemented.');
	}
	toString(): string {
		return this.body.map(definition => definition.toString()).join('\n');
	}
	toJson(): { [key: string]: any; } {
		return {
			body: this.body.map(method => method.toJSON())
		};
	}
}

export class Class extends AbstractExpressionNode {
	private sharedVariables?: Scope<any>[];
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
	shareVariables(scopeList: Scope<any>[]): void {
		this.sharedVariables = scopeList;
	}
	set(stack: Stack) {
		throw new Error(`Class.#set() has no implementation.`);
	}
	get(stack: Stack) {
		let classEval: TypeOf<any> & { [keyL: string]: any };

		const className = this.id?.get(stack) as string | undefined;
		const parentClass = this.superClass?.get(stack) as TypeOf<any> | undefined;

		if (parentClass) {
			classEval = this.createSubClass(parentClass, className)
		} else {
			classEval = this.createClass(className);
		}

		// init static class properties and methods
		this.getStaticPropertyDefinitionExpressions().forEach(property => {
			const propertyName = property.getKey().get(stack);
			const propertyValue = property.getValue()?.get(stack);
			classEval[propertyName] = propertyValue;
		});
		this.getStaticMethodDefinitionExpressions().forEach(method => {
			const propertyName = method.getKey().get(stack);
			const propertyValue = method.getValue()?.get(stack);
			classEval[propertyName] = propertyValue;
		});

		// init class body properties and methods
		this.getClassPropertyDefinitionExpressions().forEach(property => {
			const propertyName = property.getKey().get(stack);
			const propertyValue = property.getValue()?.get(stack);
			classEval.prototype[propertyName] = propertyValue;
		});
		this.getClassMethodDefinitionExpressions().forEach(method => {
			const propertyName = method.getKey().get(stack);
			const propertyValue = method.getValue()?.get(stack);
			classEval.prototype[propertyName] = propertyValue;
		});

		// run initialize static code
		const initializeBlock = this.getStaticBlockExpression();
		if (initializeBlock) {
			initializeBlock.get(stack);
		}
		return classEval;
	}
	private getConstructorExpression(): MethodDefinition | undefined {
		return this.body.getBody()
			.filter(field => field instanceof MethodDefinition && field.getKind() == 'constructor')[0] as MethodDefinition | undefined;
	}
	private getStaticBlockExpression(): StaticBlock | undefined {
		return this.body.getBody()
			.filter(field => field instanceof StaticBlock)[0] as StaticBlock | undefined;
	}
	private getStaticMethodDefinitionExpressions(): MethodDefinition[] {
		return this.body.getBody()
			.filter(field => field instanceof MethodDefinition && field.isStatic()) as MethodDefinition[];
	}
	private getClassMethodDefinitionExpressions(): MethodDefinition[] {
		return this.body.getBody()
			.filter(field => field instanceof MethodDefinition && !field.isStatic() && 'constructor' !== field.getKind()) as MethodDefinition[];
	}
	private getStaticPropertyDefinitionExpressions(): PropertyDefinition[] {
		return this.body.getBody()
			.filter(field => field instanceof PropertyDefinition && field.isStatic()) as PropertyDefinition[];
	}
	private getClassPropertyDefinitionExpressions(): PropertyDefinition[] {
		return this.body.getBody()
			.filter(field => field instanceof PropertyDefinition && !field.isStatic()) as PropertyDefinition[];
	}
	private getSuperCall(constructorExpression: MethodDefinition): CallExpression {
		const firstCall = constructorExpression.getValue().getBody()[0];
		if (!(firstCall instanceof CallExpression && Super.INSTANCE === firstCall.getCallee())) {
			throw new ReferenceError(`Must call super constructor in derived class before accessing 'this' or returning from derived constructor`);
		}
		return firstCall;
	}
	private getConstructorBodyAfterSuper(constructorExpression: MethodDefinition): ExpressionNode[] {
		const body = constructorExpression.getValue().getBody();
		if (!body || body.length == 0) {
			return [];
		}
		const firstCall = constructorExpression.getValue().getBody()[0];
		if (!(firstCall instanceof CallExpression && Super.INSTANCE === firstCall.getCallee())) {
			return body ?? [];
		}
		return body.slice(1);
	}
	private initClassScope(stack: Stack) {
		const innerScopes = this.sharedVariables ? this.sharedVariables.slice() : [];
		innerScopes.forEach(variableScope => stack.pushScope(variableScope));
		stack.pushClassScope();
		return innerScopes;
	}
	private createSubClass(parentClass: TypeOf<any>, className?: string) {
		const constructorExpression = this.getConstructorExpression();
		if (!constructorExpression) {
			return class extends parentClass { };
		}
		const superCallExpression = this.getSuperCall(constructorExpression);
		const constructorBody = this.getConstructorBodyAfterSuper(constructorExpression);
		let classStack: Stack;
		let classScopes: Scope<any>[];
		const handleSuperCall = (params: any[]): any[] => {
			classStack = new Stack();
			classScopes = this.initClassScope(classStack);
			constructorExpression.getValue().setParameter(classStack, params);
			return superCallExpression.getCallParameters(classStack);
		};
		className ??= '__temp_class_name__'
		const TEMP = {
			[className]: class extends parentClass {
				constructor(...params: any[]) {
					super(...handleSuperCall(params));
					classStack.declareVariable('class', 'this', this);
					for (const statement of constructorBody) {
						statement.shareVariables(classScopes);
						const returnValue = statement.get(classStack);
						if (returnValue instanceof ReturnValue) {
							classStack.clearTo(classScopes[0]);
							return;
						}
					}
					classStack.clearTo(classScopes[0]);
				}
			}
		};
		return TEMP[className];
	}
	private createClass(className?: string) {
		const constructorExpression = this.getConstructorExpression();
		if (!constructorExpression) {
			return class { };
		}
		const self = this;

		// define class name
		className ??= '__temp_class_name__'
		const TEMP = {
			[className]: class {
				constructor(...params: any[]) {
					const classStack = new Stack();
					const classScopes = self.initClassScope(classStack);
					constructorExpression!.getValue().setParameter(classStack, params);
					classStack.declareVariable('class', 'this', this);
					for (const statement of constructorExpression!.getValue().getBody()) {
						statement.shareVariables(classScopes);
						const returnValue = statement.get(classStack);
						if (returnValue instanceof ReturnValue) {
							classStack.clearTo(classScopes[0]);
							return;
						}
					}
					classStack.clearTo(classScopes[0]);
				}
			}
		};
		return TEMP[className];
	}

	dependency(computed?: true): ExpressionNode[] {
		throw new Error('Method not implemented.');
	}
	dependencyPath(computed?: true): ExpressionEventPath[] {
		throw new Error('Method not implemented.');
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
export class ClassDeclaration extends Class implements CanDeclareExpression {
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
