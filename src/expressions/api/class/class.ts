import type {
	CanDeclareExpression, ExpressionEventPath,
	ExpressionNode, NodeDeserializer, VisitNodeType
} from '../expression.js';
import type { Scope } from '../../scope/scope.js';
import { __decorate } from 'tslib';
import { Stack } from '../../scope/stack.js';
import { AbstractExpressionNode, ReturnValue } from '../abstract.js';
import { Deserializer } from '../deserialize/deserialize.js';
import { Identifier } from '../definition/values.js';
import { MemberExpression } from '../definition/member.js';
import { FunctionExpression } from '../definition/function.js';
import { BlockStatement } from '../statement/control/block.js';
import { TypeOf } from '../utils.js';
import { CallExpression } from '../computing/call.js';
import { Decorator } from './decorator.js';


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
		else if (MetaProperty.getJsonName(node.meta) === 'import' && MetaProperty.getJsonName(node.property) === 'meta') {
			return MetaProperty.ImportMeta;
		}
		return new MetaProperty(
			deserializer(node.meta),
			deserializer(node.property)
		);
	}
	static visit(node: MetaProperty, visitNode: VisitNodeType): void {
		visitNode(node.meta);
		visitNode(node.property);
	}
	constructor(private meta: Identifier, property: Identifier) {
		super(meta, property, false);
	}
	getMeta() {
		return this.meta;
	}
	shareVariables(scopeList: Scope<any>[]): void { }
	get(stack: Stack, thisContext?: any) {
		if (MetaProperty.getJsonName(this.meta) === 'new' && MetaProperty.getJsonName(this.property) === 'target') {
			return stack.get('new.target');
		}
		else if (MetaProperty.getJsonName(this.meta) === 'import' && MetaProperty.getJsonName(this.property) === 'meta') {
			const importObject = stack.getModule()?.get('import');
			return importObject['meta'];
		}
		return super.get(stack, thisContext);
	}
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
export class PrivateIdentifier extends AbstractExpressionNode {
	static fromJSON(node: PrivateIdentifier): PrivateIdentifier {
		return new PrivateIdentifier(
			node.name as string
		);
	}
	constructor(private name: string) {
		super();
	}
	getName() {
		return this.name;
	}
	set(stack: Stack, value: any) {
		const privateScope = stack.findScope('#__private__');
		privateScope.getScope('#__private__')?.set(this.name, value);
	}
	get(stack: Stack, thisContext?: any) {
		const privateObj = stack.get('#__private__');
		return privateObj[this.name];
	}
	dependency(computed?: true): ExpressionNode[] {
		return [];
	}
	dependencyPath(computed?: true): ExpressionEventPath[] {
		return [];
	}
	shareVariables(scopeList: Scope<any>[]): void { }
	toString(): string {
		return `#${this.name}`;
	}
	toJson(): { [key: string]: any; } {
		return {
			name: this.name
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

export abstract class AbstractDefinition extends AbstractExpressionNode {
	protected 'static': boolean;
	constructor(
		protected key: ExpressionNode | PrivateIdentifier,
		protected decorators: Decorator[],
		protected computed: boolean,
		isStatic: boolean,
		protected value?: ExpressionNode,) {
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
	getDecorators() {
		return this.decorators;
	}
	shareVariables(scopeList: Scope<any>[]): void { }
	set(stack: Stack, value: any) {
		throw new Error('AbstractDefinition.#set() Method not implemented.');
	}
	get(stack: Stack, thisContext?: any) {
		throw new Error('AbstractDefinition.#get() Method not implemented.');
	}
	dependency(computed?: true): ExpressionNode[] {
		return [];
	}
	dependencyPath(computed?: true): ExpressionEventPath[] {
		return [];
	}
	abstract toString(): string;
	abstract toJson(): { [key: string]: any; };
}

export type MethodDefinitionKind = 'constructor' | 'method' | 'set' | 'get';

/**
 * - When key is a PrivateIdentifier, computed must be false and kind can not be "constructor".
 */
@Deserializer('MethodDefinition')
export class MethodDefinition extends AbstractDefinition {
	static fromJSON(node: MethodDefinition, deserializer: NodeDeserializer<any>): MethodDefinition {
		return new MethodDefinition(
			node.kind,
			deserializer(node.key),
			deserializer(node.value),
			node.decorators.map(deserializer),
			node.computed,
			node.static
		);
	}
	static visit(node: MethodDefinition, visitNode: VisitNodeType): void {
		visitNode(node.key);
		visitNode(node.value);
		node.decorators.forEach(visitNode);
	}
	declare protected value: FunctionExpression;
	constructor(
		private kind: MethodDefinitionKind,
		key: ExpressionNode | PrivateIdentifier,
		value: FunctionExpression,
		decorators: Decorator[],
		computed: boolean,
		isStatic: boolean) {
		super(key, decorators, computed, isStatic, value);
	}
	getKind() {
		return this.kind;
	}
	getValue() {
		return this.value;
	}
	toString(): string {
		let str = this.decorators.map(decorator => decorator.toString()).join(' ');
		if (str.length) {
			str += ' ';
		}
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
			key: this.key.toJSON(),
			value: this.value.toJSON(),
			decorators: this.decorators.map(decorator => decorator.toJSON()),
			computed: this.computed,
			static: this.static,
		};
	}
}



/**
 * - When key is a PrivateIdentifier, computed must be false.
 */
@Deserializer('PropertyDefinition')
export class PropertyDefinition extends AbstractDefinition {
	static fromJSON(node: PropertyDefinition, deserializer: NodeDeserializer<any>): PropertyDefinition {
		return new PropertyDefinition(
			deserializer(node.key),
			node.decorators.map(deserializer),
			node.computed,
			node.static,
			node.value && deserializer(node.value)
		);
	}
	static visit(node: PropertyDefinition, visitNode: VisitNodeType): void {
		visitNode(node.key);
		node.value && visitNode(node.value);
	}

	constructor(
		key: ExpressionNode | PrivateIdentifier,
		decorators: Decorator[],
		computed: boolean,
		isStatic: boolean,
		value?: ExpressionNode) {
		super(key, decorators, computed, isStatic, value);
	}
	toString(): string {
		const decorators = this.decorators.map(decorator => decorator.toString()).join('\n');
		const name = this.computed ? `[${this.key.toString()}]` : this.key.toString();
		if (this.value) {
			return `${name} = ${this.value.toString()};`
		}
		return `${decorators.length ? decorators + ' ' : ''}${name};`
	}
	toJson(): { [key: string]: any; } {
		return {
			key: this.key.toJSON(),
			value: this.value?.toJSON(),
			decorators: this.decorators.map(decorator => decorator.toJSON()),
			computed: this.computed,
			static: this.static,
		};
	}
}



@Deserializer('AccessorProperty')
export class AccessorProperty extends AbstractDefinition {
	static fromJSON(node: AccessorProperty, deserializer: NodeDeserializer): AccessorProperty {
		return new AccessorProperty(
			deserializer(node.key),
			node.decorators.map(deserializer) as Decorator[],
			node.computed,
			node.static,
			node.value ? deserializer(node.value) : void 0
		);
	}
	static visit(node: AccessorProperty, visitNode: VisitNodeType): void {
		visitNode(node.key);
		node.value && visitNode(node.value);
		node.decorators.forEach(visitNode);
	}
	constructor(
		key: ExpressionNode | PrivateIdentifier,
		decorators: Decorator[],
		computed: boolean,
		isStatic: boolean,
		value?: ExpressionNode) {
		super(key, decorators, computed, isStatic, value);
	}
	toString(): string {
		const decorators = this.decorators.map(decorator => decorator.toString()).join('\n');
		const name = this.computed ? `[${this.key.toString()}]` : this.key.toString();
		if (this.value) {
			return `${name} = ${this.value.toString()};`
		}
		return `${decorators.length ? decorators + ' ' : ''}accessor ${name};`
	}
	toJson(): { [key: string]: any; } {
		return {
			key: this.key.toJSON(),
			decorators: this.decorators.map(decorator => decorator.toJSON()),
			computed: this.computed,
			static: this.static,
			value: this.value?.toJSON(),
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
	static visit(node: ClassBody, visitNode: VisitNodeType): void {
		node.body.forEach(visitNode);
	}
	constructor(private body: (MethodDefinition | PropertyDefinition | StaticBlock | AccessorProperty)[]) {
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

type Definition = {
	key: string,
	private: boolean,
	static: boolean,
	value: any
};
type BodyDefinition = {
	methods: (Definition & { kind: MethodDefinitionKind })[],
	properties: Definition[],
	accessors: Definition[]
};
type DecoratorsInfo = { name: string, decorators: any[], desc: any };

export class Class extends AbstractExpressionNode {
	private sharedVariables?: Scope<any>[];
	constructor(
		protected body: ClassBody,
		protected decorators: Decorator[],
		protected id?: Identifier,
		protected superClass?: ExpressionNode) {
		super();
	}
	getBody() {
		return this.body;
	}
	getDecorators() {
		return this.decorators;
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

		// _name = new WeakMap(), _age = new WeakMap();
		let classEval: TypeOf<any> & { [keyL: string]: any };
		const bodyDefinition: BodyDefinition = {
			methods: [],
			properties: [],
			accessors: []
		};

		// init class body properties and methods
		const bodyDecorators: DecoratorsInfo[] = [];
		const bodyStaticDecorators: DecoratorsInfo[] = [];
		this.getMethodDefinitions().forEach(method => {
			const methodDefinition: Definition & { kind: MethodDefinitionKind } = {
				kind: method.getKind(),
				key: method.getKey().get(stack),
				value: method.getValue()?.get(stack),
				static: method.isStatic(),
				private: method.getKey() instanceof PrivateIdentifier
			};
			bodyDefinition.methods.push(methodDefinition);
			this.initBodyDecorators(stack, method.isStatic() ? bodyStaticDecorators : bodyDecorators, methodDefinition.key, method.getDecorators(), null);
		});

		this.getPropertyDefinitions().forEach(property => {
			const propertyDefinition: Definition = {
				key: property.getKey().get(stack),
				value: property.getValue()?.get(stack),
				static: property.isStatic(),
				private: property.getKey() instanceof PrivateIdentifier
			};
			bodyDefinition.properties.push(propertyDefinition);
			this.initBodyDecorators(stack, property.isStatic() ? bodyStaticDecorators : bodyDecorators, propertyDefinition.key, property.getDecorators(), null);
		});
		this.getAccessorProperties().forEach(accessorProperty => {
			const accessorDefinition: Definition = {
				key: accessorProperty.getKey().get(stack),
				value: accessorProperty.getValue()?.get(stack),
				static: accessorProperty.isStatic(),
				private: accessorProperty.getKey() instanceof PrivateIdentifier
			};
			bodyDefinition.accessors.push(accessorDefinition);
			this.initBodyDecorators(stack, accessorProperty.isStatic() ? bodyStaticDecorators : bodyDecorators, accessorDefinition.key, accessorProperty.getDecorators(), null);
		});



		const className = this.id?.get(stack) as string | undefined;
		const parentClass = this.superClass?.get(stack) as TypeOf<any> | undefined;

		if (parentClass) {
			classEval = this.createSubClass(parentClass, bodyDefinition, className)
		} else {
			classEval = this.createClass(bodyDefinition, className);
		}

		// run initialize static code
		const initializeBlock = this.getStaticBlockExpression();
		if (initializeBlock) {
			initializeBlock.get(stack);
		}

		// run decorators
		bodyDecorators.forEach(item => {
			__decorate(item.decorators, classEval.prototype, item.name, item.desc);
		});
		bodyStaticDecorators.forEach(item => {
			__decorate(item.decorators, classEval.prototype, item.name, item.desc);
		});
		const decorators = this.decorators.map(decorator => decorator.get(stack));
		classEval = __decorate(decorators, classEval);
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
	private getMethodDefinitions(): MethodDefinition[] {
		return this.body.getBody()
			.filter(field => field instanceof MethodDefinition && 'constructor' !== field.getKind()) as MethodDefinition[];
	}
	private getPropertyDefinitions(): PropertyDefinition[] {
		return this.body.getBody()
			.filter(field => field instanceof PropertyDefinition) as PropertyDefinition[];
	}
	private getAccessorProperties(): AccessorProperty[] {
		return this.body.getBody()
			.filter(field => field instanceof AccessorProperty) as AccessorProperty[];
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
	private initBodyDecorators(stack: Stack, bodyDecorators: { name: string, decorators: any[], desc: any }[], name: string, decorators: Decorator[], desc: any) {
		const decoratorsRef = decorators.map(decorator => decorator.get(stack));
		if (decoratorsRef.length > 0) {
			bodyDecorators.push({ name, decorators: decoratorsRef, desc });
		}
	}
	private initClassScope(stack: Stack) {
		const innerScopes = this.sharedVariables ? this.sharedVariables.slice() : [];
		innerScopes.forEach(variableScope => stack.pushScope(variableScope));
		stack.pushBlockScope();
		return innerScopes;
	}
	private createSubClass(parentClass: TypeOf<any>, bodyDefinition: BodyDefinition, className?: string) {
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
				static #__static_private__: { [key: string | number | symbol]: any } = {};
				static {
					// init statics

				}
				#__private_body__: { [key: string | number | symbol]: any } = {};
				constructor(...params: any[]) {
					super(...handleSuperCall(params));
					classStack.declareVariable('this', this);
					classStack.declareVariable('new.target', new.target);
					classStack.declareVariable('#__private', this.#__private_body__);
					classStack.declareVariable('__callSuperMethod', this.__callSuperMethod);
					classStack.declareVariable('__getSuperProperty', this.__getSuperProperty);

					bodyDefinition.methods
						.filter(property => property.static || !property.private)
						.forEach(method => {
							switch (method.kind) {
								case 'method':
									this.#__private_body__[method.key] = method.value;
									break;
								case 'set':
									Object.defineProperty(this.#__private_body__, method.key, {
										configurable: true,
										enumerable: false,
										set: method.value as (v: any) => void,
									});
									break;
								case 'get':
									Object.defineProperty(this.#__private_body__, method.key, {
										configurable: true,
										enumerable: false,
										get: method.value as () => any,
									});
									break;
								default:
									break;
							}
						});
					bodyDefinition.accessors
						.filter(property => property.static)
						.forEach(accessorProperty => {
							this.#__private_body__[accessorProperty.key] = accessorProperty.value;
							Object.defineProperty(this, accessorProperty.key, {
								configurable: true,
								enumerable: false,
								set: (value: any): void => {
									this.#__private_body__[accessorProperty.key] = value;
								},
								get: (): any => {
									return this.#__private_body__[accessorProperty.key];
								},
							});
						});
					bodyDefinition.properties
						.filter(property => property.static || !property.private)
						.forEach(property => {
							this.#__private_body__[property.key] = property.value;
						});


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
				__getSuperProperty(name: string) {
					return super[name];
				}
				__callSuperMethod(name: string) {
					return super[name]();
				}
			}
		};
		return TEMP[className];
	}
	private createClass(bodyDefinition: BodyDefinition, className?: string) {
		const constructorExpression = this.getConstructorExpression();
		if (!constructorExpression) {
			return class { };
		}
		const self = this;

		// define class name
		className ??= '__temp_class_name__'
		const TEMP = {
			[className]: class {
				static #__static_private__: { [key: string | number | symbol]: any } = {};
				static {
					// init statics

				}
				#__private_body__: { [key: string | number | symbol]: any } = {};
				constructor(...params: any[]) {
					const classStack = new Stack();
					const classScopes = self.initClassScope(classStack);
					constructorExpression!.getValue().setParameter(classStack, params);
					classStack.declareVariable('this', this);
					classStack.declareVariable('new.target', new.target);
					classStack.declareVariable('#__private__', this.#__private_body__);
					bodyDefinition.methods
						.filter(property => property.static || !property.private)
						.forEach(method => {
							switch (method.kind) {
								case 'method':
									this.#__private_body__[method.key] = method.value;
									break;
								case 'set':
									Object.defineProperty(this.#__private_body__, method.key, {
										configurable: true,
										enumerable: false,
										set: method.value as (v: any) => void,
									});
									break;
								case 'get':
									Object.defineProperty(this.#__private_body__, method.key, {
										configurable: true,
										enumerable: false,
										get: method.value as () => any,
									});
									break;
								default:
									break;
							}
						});
					bodyDefinition.accessors
						.filter(property => property.static)
						.forEach(accessorProperty => {
							this.#__private_body__[accessorProperty.key] = accessorProperty.value;
							Object.defineProperty(this, accessorProperty.key, {
								configurable: true,
								enumerable: false,
								set: (value: any): void => {
									this.#__private_body__[accessorProperty.key] = value;
								},
								get: (): any => {
									return this.#__private_body__[accessorProperty.key];
								},
							});
						});
					bodyDefinition.properties
						.filter(property => property.static || !property.private)
						.forEach(property => {
							this.#__private_body__[property.key] = property.value;
						});

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
		const decorators = this.decorators.map(decorator => decorator.toString()).join('\n');
		let classDeclaration = 'class ';
		if (this.id) {
			classDeclaration += this.id.toString();
		}
		if (this.superClass) {
			classDeclaration += ' extends ' + this.superClass.toString();
		}
		return `${decorators}${classDeclaration} {${this.body.toString()}\n`;
	}
	toJson(): object {
		return {
			body: this.body.toJSON(),
			decorators: this.decorators.map(decorator => decorator.toJSON()),
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
	static visit(node: ClassDeclaration, visitNode: VisitNodeType): void {
		visitNode(node.body);
		node.id && visitNode(node.id);
		node.superClass && visitNode(node.superClass);
	}
	declare protected id?: Identifier;
	declareVariable(stack: Stack, propertyValue?: any) {
		this.id && stack.declareVariable(this.id.getName(), propertyValue);
	}
	getDeclarationName(): string {
		return this.id?.getDeclarationName()!;
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
	static visit(node: ClassExpression, visitNode: VisitNodeType): void {
		visitNode(node.body);
		node.id && visitNode(node.id);
		node.superClass && visitNode(node.superClass);
	}
}
