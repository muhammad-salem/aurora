import type {
	CanDeclareExpression, ExpressionEventPath,
	ExpressionNode, NodeDeserializer, VisitNodeType
} from '../expression.js';
import type { Scope } from '../../scope/scope.js';
import { __decorate } from 'tslib';
import { Stack } from '../../scope/stack.js';
import { AbstractExpressionNode } from '../abstract.js';
import { Deserializer } from '../deserialize/deserialize.js';
import { Identifier } from '../definition/values.js';
import { MemberExpression } from '../definition/member.js';
import { FunctionExpression } from '../definition/function.js';
import { BlockStatement } from '../statement/control/block.js';
import { TypeOf } from '../utils.js';
import { Decorator } from './decorator.js';
import { CallExpression } from '../computing/call.js';

const TEMP_CLASS_NAME: unique symbol = Symbol('temp_class_name');
const SUPER: unique symbol = Symbol('super');
const NEW_TARGET: unique symbol = Symbol('new.target');
const IMPORT_META: unique symbol = Symbol('import.meta');
const STACK: unique symbol = Symbol('stack');

const GET_PARAMETERS: unique symbol = Symbol('getParameters');
const GET_SUPER_PROPERTY: unique symbol = Symbol('getSuperProperty');
const CALL_SUPER_Method: unique symbol = Symbol('callSuperMethod');

const CONSTRUCTOR: unique symbol = Symbol('constructor');
const PRIVATE_SYMBOL: unique symbol = Symbol('#private');
const INIT_PRIVATE_SYMBOL: unique symbol = Symbol('#init_private');
const STATIC_INITIALIZATION_BLOCK: unique symbol = Symbol('static_block');

interface ClassConstructor {
	/**
	 * A reference to the prototype.
	 */
	readonly prototype: ClassInstance;

	[GET_PARAMETERS](args: any[]): any[];
	[STATIC_INITIALIZATION_BLOCK]: Function[];

	[INIT_PRIVATE_SYMBOL]: { [key: PropertyKey]: any };
	[PRIVATE_SYMBOL]: { [key: PropertyKey]: any };
	[key: string]: any;
}

declare var ClassInstance: ClassConstructor;
interface ClassInstance {
	[CONSTRUCTOR]: Function;
	[INIT_PRIVATE_SYMBOL]: { [key: PropertyKey]: any };
	[PRIVATE_SYMBOL]: { [key: PropertyKey]: any };
	[STACK]: Stack;
	[key: string]: any;
}


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
			return stack.get(NEW_TARGET);
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
		const privateScope = stack.findScope(PRIVATE_SYMBOL);
		privateScope.getScope(PRIVATE_SYMBOL)?.set(this.name, value);
	}
	get(stack: Stack, thisContext?: any) {
		const privateObj = stack.get(PRIVATE_SYMBOL);
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
		return new StaticBlock(deserializer(node.body));
	}
	constructor(body: ExpressionNode[]) {
		super(body, false);
	}
	get(stack: Stack, classConstructor?: ClassConstructor): void {
		const constructor = classConstructor!;
		constructor[STATIC_INITIALIZATION_BLOCK].push(() => super.get(stack));
	}
	toString(): string {
		return `static ${super.toString()}`;
	}
	toJson(): object {
		return {
			body: this.body.map(node => node.toJSON())
		};
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
	dependency(computed?: true): ExpressionNode[] {
		return [];
	}
	dependencyPath(computed?: true): ExpressionEventPath[] {
		return [];
	}
	abstract get(stack: Stack, classConstructor: ClassConstructor): void;
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
	get(stack: Stack, classConstructor: ClassConstructor): void {
		if (this.kind === 'constructor') {
			this.initConstructor(stack, classConstructor);
			return;
		}
		const target = this.static ? classConstructor : classConstructor.prototype;
		const value = this.value?.get(stack);
		const name = this.computed ? this.key.get(stack) as symbol : (this.key as Identifier).getName() as string;
		const ref = this.key instanceof PrivateIdentifier ? target[INIT_PRIVATE_SYMBOL] : target;
		switch (this.kind) {
			case 'method':
				ref[name] = value;
				break;
			case 'set':
				Object.defineProperty(ref, name, {
					configurable: true,
					enumerable: false,
					set: value as (v: any) => void,
				});
				break;
			case 'get':
				Object.defineProperty(ref, name, {
					configurable: true,
					enumerable: false,
					get: value as () => any,
				});
				break;
			default:
				break;
		}
		const decorators = this.decorators.map(decorator => decorator.get(stack));
		__decorate(decorators, target, name, null);
	}
	private initConstructor(stack: Stack, classConstructor: ClassConstructor) {
		let superIndex = this.value.getBody()
			.findIndex(call => call instanceof CallExpression && Super.INSTANCE === call.getCallee());
		if (superIndex === -1) {
			superIndex = this.value.getBody().length;
		}
		const superCall = this.value.getBody()[superIndex] as CallExpression | undefined;

		const blockBeforeSuper = new BlockStatement(this.value.getBody().slice(0, superIndex), false);
		const blockAfterSuper = new BlockStatement(this.value.getBody().slice(superIndex + 1), false);

		if (superCall) {
			classConstructor[GET_PARAMETERS] = function (this: ClassConstructor, params: any[]) {
				const scope = stack.pushBlockScope();
				this.value.setParameter(stack, params);
				blockBeforeSuper.get(stack);
				const parameters = superCall.getCallParameters(stack);
				stack.clearTo(scope);
				return parameters;
			};
		}

		classConstructor.prototype[CONSTRUCTOR] = function (this: ClassInstance, params: any[]) {
			const scope = this[STACK].pushBlockScope();
			blockAfterSuper.get(this[STACK]);
			stack.clearTo(scope);
		};
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
	get(stack: Stack, classConstructor: ClassConstructor): void {
		const target = this.static ? classConstructor : classConstructor.prototype;
		const value = this.value?.get(stack);
		const name = this.computed ? this.key.get(stack) as symbol : (this.key as Identifier).getName() as string;
		const ref = this.key instanceof PrivateIdentifier ? target[INIT_PRIVATE_SYMBOL] : target;
		ref[name as string] = value;
		const decorators = this.decorators.map(decorator => decorator.get(stack));
		__decorate(decorators, target, name, null);
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
		key: ExpressionNode,
		decorators: Decorator[],
		computed: boolean,
		isStatic: boolean,
		value?: ExpressionNode) {
		super(key, decorators, computed, isStatic, value);
	}
	get(stack: Stack, classConstructor: ClassConstructor): void {
		const target = this.static ? classConstructor : classConstructor.prototype;
		const value = this.value?.get(stack);
		const name = this.computed ? this.key.get(stack) as symbol : (this.key as Identifier).getName() as string;
		target[INIT_PRIVATE_SYMBOL][name] = value;
		Object.defineProperty(target, name, {
			configurable: true,
			enumerable: false,
			set: function (this: ClassInstance, setValue: any) {
				this[PRIVATE_SYMBOL][name] = setValue;
			},
		});
		Object.defineProperty(target, name, {
			configurable: true,
			enumerable: false,
			get: function (this: ClassInstance) {
				return this[PRIVATE_SYMBOL][name];
			},
		});
		const decorators = this.decorators.map(decorator => decorator.get(stack));
		__decorate(decorators, target, name, null);
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
	constructor(private body: (MethodDefinition | PropertyDefinition | AccessorProperty | StaticBlock)[]) {
		super();
	}
	getBody() {
		return this.body;
	}
	shareVariables(scopeList: Scope<any>[]): void { }
	set(stack: Stack, value: any) {
		throw new Error('Method not implemented.');
	}
	get(stack: Stack, classConstructor: ClassConstructor) {
		this.body.forEach(definition => definition.get(stack, classConstructor));
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
		const className = this.id?.get(stack) as string | undefined;
		const parentClass = this.superClass?.get(stack) as TypeOf<any> | undefined ?? class { };
		let classConstructor: ClassConstructor = this.createClass(stack, parentClass, className);
		// build class body
		this.body.get(stack, classConstructor);

		classConstructor[PRIVATE_SYMBOL] = Object.assign(classConstructor[PRIVATE_SYMBOL], classConstructor[INIT_PRIVATE_SYMBOL]);
		Reflect.deleteProperty(classConstructor, INIT_PRIVATE_SYMBOL);
		// apply class decorators
		const decorators = this.decorators.map(decorator => decorator.get(stack));
		classConstructor = __decorate(decorators, classConstructor);
		return classConstructor;
	}

	private createClass(stack: Stack, parentClass: TypeOf<any>, className: string | symbol = TEMP_CLASS_NAME) {
		const TEMP: { [key: typeof className]: ClassConstructor } = {
			[className]: class extends parentClass {
				static [GET_PARAMETERS](args: any[]): any[] {
					return [];
				}
				static [STATIC_INITIALIZATION_BLOCK]: Function[] = [];
				static [INIT_PRIVATE_SYMBOL] = {};

				static [PRIVATE_SYMBOL]: { [key: string | number | symbol]: any } = {};

				static {
					// init statics
					this[STATIC_INITIALIZATION_BLOCK].forEach(block => block());
				}

				[PRIVATE_SYMBOL]: { [key: string | number | symbol]: any } = {};
				[INIT_PRIVATE_SYMBOL] = {};

				[STACK]: Stack;
				constructor(...params: any[]) {
					const parameters = TEMP[className][GET_PARAMETERS](params);
					super(...parameters);
					this[PRIVATE_SYMBOL] = Object.assign(this[PRIVATE_SYMBOL], this[INIT_PRIVATE_SYMBOL]);
					this[STACK] = stack.copyStack();
					const instanceStack = this[STACK];
					instanceStack.pushBlockScope();
					instanceStack.declareVariable('this', this);
					instanceStack.declareVariable(NEW_TARGET, new.target);
					instanceStack.declareVariable(PRIVATE_SYMBOL, this[PRIVATE_SYMBOL]);
					instanceStack.declareVariable(CALL_SUPER_Method, (name: string) => super[name]());
					instanceStack.declareVariable(GET_SUPER_PROPERTY, (name: string) => super[name]);
					instanceStack.pushReactiveScope();
					this[CONSTRUCTOR]();
				}
				[CONSTRUCTOR](): void { }
			}
		};
		return TEMP[className as string];
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
