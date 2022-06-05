import type {
	DeclarationExpression, ExpressionEventPath,
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

const TEMP_CLASS_NAME: unique symbol = Symbol('TempClassName');
const SUPER: unique symbol = Symbol('Super');
const NEW_TARGET: unique symbol = Symbol('NewTarget');
const IMPORT_META: unique symbol = Symbol('ImportMeta');
const STACK: unique symbol = Symbol('Stack');

const GET_PARAMETERS: unique symbol = Symbol('GetParameters');
const GET_SUPER_PROPERTY: unique symbol = Symbol('GetSuperProperty');
const CALL_SUPER_Method: unique symbol = Symbol('CallSuperMethod');

const CONSTRUCTOR: unique symbol = Symbol('Constructor');
const PRIVATE_SYMBOL: unique symbol = Symbol('Private');
const INSTANCE_PRIVATE_SYMBOL: unique symbol = Symbol('InstancePrivate');
const STATIC_INITIALIZATION_BLOCK: unique symbol = Symbol('StaticBlock');

interface ClassConstructor {
	/**
	 * A reference to the prototype.
	 */
	readonly prototype: ClassInstance;

	[GET_PARAMETERS](args: any[]): any[];
	[STATIC_INITIALIZATION_BLOCK]: Function[];
	[PRIVATE_SYMBOL]: { [key: PropertyKey]: any };
	[INSTANCE_PRIVATE_SYMBOL]: { [key: PropertyKey]: any };
	[CONSTRUCTOR]: Function;
	[key: string]: any;
}

declare var ClassInstance: ClassConstructor;
interface ClassInstance {
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
	get(stack: Stack, thisContext?: ClassInstance | ClassConstructor) {
		if (thisContext) {
			return thisContext[PRIVATE_SYMBOL][this.name];
		}
		// return stack.get(this.name);
		let privateObj = stack.get('this');
		if (privateObj) {
			return privateObj[PRIVATE_SYMBOL][this.name];
		}
		privateObj = stack.get(PRIVATE_SYMBOL);
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
	getTarget(classConstructor: ClassConstructor) {
		return this.static
			? (this.key instanceof PrivateIdentifier ? classConstructor[PRIVATE_SYMBOL] : classConstructor)
			: (this.key instanceof PrivateIdentifier ? classConstructor[INSTANCE_PRIVATE_SYMBOL] : classConstructor.prototype);
	}
	getKeyName(stack: Stack) {
		switch (true) {
			case this.computed: return this.key.get(stack);
			case this.key instanceof Identifier:
			case this.key instanceof PrivateIdentifier: return (this.key as Identifier | PrivateIdentifier).getName() as string;
			default: return this.key.toString();
		}
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
		const target = this.getTarget(classConstructor);
		const name: string = this.getKeyName(stack);
		const value = this.value?.get(stack);
		switch (this.kind) {
			case 'method':
				target[name] = value;
				break;
			case 'set':
				Object.defineProperty(target, name, {
					configurable: true,
					enumerable: false,
					set: value as (v: any) => void,
				});
				break;
			case 'get':
				Object.defineProperty(target, name, {
					configurable: true,
					enumerable: false,
					get: value as () => any,
				});
				break;
			default:
				break;
		}
		const decorators = this.decorators.map(decorator => decorator.get(stack));
		decorators.length && __decorate(decorators, target, name, null);
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

		classConstructor[CONSTRUCTOR] = function (this: ClassInstance, params: any[]) {
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
		if (this.static) {
			str += 'static ';
		}
		str += this.key.toString().concat(' ');
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
		const target = this.getTarget(classConstructor);
		const name: string = this.getKeyName(stack);
		const value = this.value?.get(stack);
		target[name as string] = value;
		const decorators = this.decorators.map(decorator => decorator.get(stack));
		decorators.length && __decorate(decorators, target, name, null);
	}
	toString(): string {
		const decorators = this.decorators.map(decorator => decorator.toString()).join('\n');
		const name = this.computed ? `[${this.key.toString()}]` : this.key.toString();
		return `${decorators.length ? decorators + ' ' : ''}${this.static ? 'static ' : ''}${name}${this.value ? ` = ${this.value.toString()}` : ''};`
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
		const target = this.getTarget(classConstructor);
		const name = this.getKeyName(stack);
		const value = this.value?.get(stack);
		target[name] = value;
		const ref = this.static ? classConstructor : classConstructor.prototype;
		Object.defineProperty(ref, name, {
			configurable: true,
			enumerable: false,
			set: function (this: ClassInstance, setValue: any) {
				this[PRIVATE_SYMBOL][name] = setValue;
			},
		});
		Object.defineProperty(ref, name, {
			configurable: true,
			enumerable: false,
			get: function (this: ClassInstance) {
				return this[PRIVATE_SYMBOL][name];
			},
		});
		const decorators = this.decorators.map(decorator => decorator.get(stack));
		decorators.length && __decorate(decorators, ref, name, null);
	}
	toString(): string {
		const decorators = this.decorators.map(decorator => decorator.toString()).join('\n');
		const name = this.computed ? `[${this.key.toString()}]` : this.key.toString();
		return `${decorators.length ? decorators.concat(' ') : ''}${this.static ? 'static ' : ''}accessor ${name}${this.value ? ` = ${this.value.toString()}` : ''};`
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

		// apply class decorators
		const decorators = this.decorators.map(decorator => decorator.get(stack));
		classConstructor = __decorate(decorators, classConstructor);

		// run static initialization block
		classConstructor[STATIC_INITIALIZATION_BLOCK].forEach(block => block());
		Reflect.deleteProperty(classConstructor, STATIC_INITIALIZATION_BLOCK);

		return classConstructor;
	}

	private createClass(stack: Stack, parentClass: TypeOf<any>, className: string | symbol = TEMP_CLASS_NAME) {
		const TEMP: { [key: typeof className]: ClassConstructor } = {
			[className]: class extends parentClass {
				static [GET_PARAMETERS](args: any[]): any[] {
					return args;
				}
				static [STATIC_INITIALIZATION_BLOCK]: Function[] = [];
				static [PRIVATE_SYMBOL]: { [key: string | number | symbol]: any } = {};
				static [INSTANCE_PRIVATE_SYMBOL] = {};
				static [CONSTRUCTOR](): void { }

				[PRIVATE_SYMBOL]: { [key: string | number | symbol]: any } = {};

				[STACK]: Stack;
				constructor(...params: any[]) {
					const parameters = TEMP[className][GET_PARAMETERS](params);
					super(...parameters);
					this[PRIVATE_SYMBOL] = Object.assign(this[PRIVATE_SYMBOL], TEMP[className][INSTANCE_PRIVATE_SYMBOL]);
					this[STACK] = stack.copyStack();
					const instanceStack = this[STACK];
					instanceStack.pushBlockScope();
					instanceStack.declareVariable('this', this);
					instanceStack.declareVariable(NEW_TARGET, new.target);
					instanceStack.declareVariable(PRIVATE_SYMBOL, this[PRIVATE_SYMBOL]);
					instanceStack.declareVariable(CALL_SUPER_Method, (name: string) => super[name]());
					instanceStack.declareVariable(GET_SUPER_PROPERTY, (name: string) => super[name]);
					instanceStack.pushReactiveScope();
					// init fields and methods values
					TEMP[className][CONSTRUCTOR]();
				}
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
		return `${decorators}${classDeclaration} {${this.body.toString()}}`;
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
export class ClassDeclaration extends Class implements DeclarationExpression {
	static fromJSON(node: ClassDeclaration, deserializer: NodeDeserializer<any>): ClassDeclaration {
		return new ClassDeclaration(
			deserializer(node.body),
			deserializer(node.id),
			node.superClass && deserializer(node.superClass)
		);
	}
	static visit(node: ClassDeclaration, visitNode: VisitNodeType): void {
		visitNode(node.body);
		node.decorators.forEach(visitNode);
		visitNode(node.id);
		node.superClass && visitNode(node.superClass);
	}
	declare protected id: Identifier;
	constructor(body: ClassBody, decorators: Decorator[], id: Identifier, superClass?: ExpressionNode) {
		super(body, decorators, id, superClass);
	}
	declareVariable(stack: Stack, propertyValue?: any) {
		stack.declareVariable(this.id.getName(), propertyValue);
	}
	getDeclarationName(): string {
		return this.id.getDeclarationName()!;
	}

	override get(stack: Stack) {
		const classConstructor = super.get(stack);
		this.id.declareVariable(stack, classConstructor);
		return classConstructor;
	}
}

@Deserializer('ClassExpression')
export class ClassExpression extends Class {
	static fromJSON(node: ClassExpression, deserializer: NodeDeserializer<any>): ClassExpression {
		return new ClassExpression(
			deserializer(node.body),
			node.superClass && deserializer(node.superClass)
		);
	}
	static visit(node: ClassExpression, visitNode: VisitNodeType): void {
		visitNode(node.body);
		node.decorators.forEach(visitNode);
		node.id && visitNode(node.id);
		node.superClass && visitNode(node.superClass);
	}

}
