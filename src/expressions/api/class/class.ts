import type {
	DeclarationExpression, ExpressionEventPath, ExpressionNode,
	NodeDeserializer, SourceLocation, VisitNodeType
} from '../expression.js';
import { Stack } from '../../scope/stack.js';
import { AbstractExpressionNode } from '../abstract.js';
import { Deserializer } from '../deserialize/deserialize.js';
import { Identifier } from '../definition/values.js';
import { FunctionExpression } from '../definition/function.js';
import { BlockStatement } from '../statement/control/block.js';
import { TypeOf } from '../utils.js';
import { Decorator } from './decorator.js';
import { CallExpression } from '../computing/call.js';

const TEMP_CLASS_NAME: unique symbol = Symbol('TempClassName');
const PRIVATE_SYMBOL: unique symbol = Symbol('#');;

interface ClassConstructor {
	/**
	 * A reference to the prototype.
	 */
	readonly prototype: ClassInstance;

	/**
	 * private static properties and methods
	 */
	[PRIVATE_SYMBOL]: Record<PropertyKey, any>;

	/**
	 * public static class properties
	 */
	[key: PropertyKey]: any;
}

declare var ClassInstance: ClassConstructor;
interface ClassInstance {

	/**
	 * private instance properties and methods
	 */
	[PRIVATE_SYMBOL]: Record<PropertyKey, any>;

	/**
	 * public instance properties
	 */
	[key: PropertyKey]: any;
}


type PropertyInitializer = () => { key: PropertyKey, value: any, isPrivate: boolean };

class ClassInitializer {


	/**
	 * register class public static properties and methods
	 */
	private staticInitializer: Record<PropertyKey, PropertyDescriptor & ThisType<any>> = {};

	/**
	 * register class private static properties and methods
	 */
	private staticPrivateInitializer: Record<PropertyKey, PropertyDescriptor & ThisType<any>> = {};

	/**
	 * register static initialization block
	 */
	private staticInitializerBlock: (() => void)[] = [];

	/**
	 * register class constructor function
	 */
	private instanceConstructor?: Function;

	/**
	 * register super parameter resolver
	 */
	private superParameterResolver: ((params: any[]) => any[]) = (params: any[]) => params;

	/**
	 * register in class property
	 */
	private instanceMethod: Record<PropertyKey, PropertyDescriptor & ThisType<any>> = {};

	/**
	 * register method in instance private space
	 */
	private privateInstanceMethod: Record<PropertyKey, PropertyDescriptor & ThisType<any>> = {};

	/**
	 * register property in instance itself
	 */
	private instanceInitializer: PropertyInitializer[] = [];

	addStaticInitializer(key: PropertyKey, attributes: PropertyDescriptor & ThisType<any>) {
		Reflect.set(this.staticInitializer, key, attributes)
	}
	addStaticPrivateInitializer(key: PropertyKey, attributes: PropertyDescriptor & ThisType<any>) {
		Reflect.set(this.staticPrivateInitializer, key, attributes)
	}
	addStaticInitializerBlock(block: () => void) {
		this.staticInitializerBlock.push(block);
	}
	setConstructor(cstr: Function) {
		this.instanceConstructor = cstr;
	}
	setParameterResolver(resolver: (params: any[]) => any[]) {
		this.superParameterResolver = resolver;
	}
	addInstanceMethod(key: PropertyKey, attributes: PropertyDescriptor & ThisType<any>) {
		Reflect.set(this.instanceMethod, key, attributes);
	}
	addPrivateInstanceMethod(key: PropertyKey, attributes: PropertyDescriptor & ThisType<any>) {
		Reflect.set(this.privateInstanceMethod, key, attributes);
	}
	addInstanceInitializer(initializer: PropertyInitializer) {
		this.instanceInitializer.push(initializer);
	}
	initClass(classConstructor: ClassConstructor) {
		Object.defineProperties(classConstructor, this.staticInitializer);
		Object.defineProperties(classConstructor[PRIVATE_SYMBOL], this.staticPrivateInitializer);
		Object.defineProperties(classConstructor.prototype, this.instanceMethod);
		this.staticInitializerBlock.forEach(block => block());
	}
	getSuperArguments(args: any[]) {
		return this.superParameterResolver(args);
	}
	initInstance(instance: ClassInstance) {
		Object.defineProperties(instance[PRIVATE_SYMBOL], this.privateInstanceMethod);
		this.instanceInitializer.forEach(initializer => {
			const definition = initializer();
			const target = definition.isPrivate ? instance[PRIVATE_SYMBOL] : instance;
			target[definition.key] = definition.value;
		});
		this.instanceConstructor?.apply(instance);
	}
}


/**
 * A `super` pseudo-expression.
 */
@Deserializer('Super')
export class Super extends AbstractExpressionNode {
	static fromJSON(node: Super): Super {
		return new Super(node.loc);
	}
	constructor(loc?: SourceLocation) {
		super(loc);
	}
	set(stack: Stack, value: any) {
		throw new Error('Super.#set() Method not implemented.');
	}
	get(stack: Stack, thisContext?: any) {
		return stack.get('super');
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
export class MetaProperty extends AbstractExpressionNode {
	static fromJSON(node: MetaProperty, deserializer: NodeDeserializer<any>): MetaProperty {
		return new MetaProperty(
			deserializer(node.meta),
			deserializer(node.property),
			node.loc
		);
	}
	static visit(node: MetaProperty, visitNode: VisitNodeType): void {
		visitNode(node.meta);
		visitNode(node.property);
	}
	constructor(private meta: Identifier, private property: Identifier, loc?: SourceLocation) {
		super(loc);
	}
	getMeta() {
		return this.meta;
	}
	getProperty() {
		return this.property;
	}
	get(stack: Stack) {
		const metaRef = this.meta.get(stack);
		if (metaRef === undefined || metaRef === null) {
			throw new TypeError(`Cannot read meta property '${this.property.toString()}' of ${metaRef}, reading [${this.toString()}]`);
		}
		return this.property.get(stack, metaRef);
	}
	set(stack: Stack, value: any) {
		throw new Error(`MetaProperty#set() has no implementation.`);
	}
	dependency(computed?: true | undefined): ExpressionNode[] {
		return [];
	}
	dependencyPath(computed?: true | undefined): ExpressionEventPath[] {
		return [];
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
export class PrivateIdentifier extends Identifier {
	static fromJSON(node: PrivateIdentifier): PrivateIdentifier {
		return new PrivateIdentifier(
			node.name as string,
			node.loc
		);
	}
	get(stack: Stack, thisContext: ClassInstance) {
		return thisContext[PRIVATE_SYMBOL][this.name];
	}
	set(stack: Stack, value: any) {
		const thisContext = stack.lastScope().getContext();
		return thisContext[PRIVATE_SYMBOL][this.name] = value;
	}
	toString(): string {
		return `#${this.name}`;
	}
}

/**
 * A static block static { } is a block statement serving as an additional static initializer.
 */
@Deserializer('StaticBlock')
export class StaticBlock extends BlockStatement {
	static fromJSON(node: StaticBlock, deserializer: NodeDeserializer<any>): StaticBlock {
		return new StaticBlock(deserializer(node.body), node.loc);
	}
	get(stack: Stack, classInitializer?: ClassInitializer): void {
		classInitializer?.addStaticInitializerBlock(super.get(stack));
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
		protected value?: ExpressionNode,
		loc?: SourceLocation) {
		super(loc);
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
	isPrivate() {
		return this.key instanceof PrivateIdentifier;
	}
	getDecorators() {
		return this.decorators;
	}
	set(stack: Stack, value: any) {
		throw new Error('AbstractDefinition.#set() Method not implemented.');
	}
	dependency(computed?: true): ExpressionNode[] {
		return [];
	}
	dependencyPath(computed?: true): ExpressionEventPath[] {
		return [];
	}
	getKeyName(stack: Stack) {
		if (this.computed) {
			// private properties can't be computed
			return (this.key as ExpressionNode).get(stack);
		}
		if (this.key instanceof Identifier) {
			return this.key.getName();
		}
		return this.key.toString();
	}
	abstract get(stack: Stack, initializer?: ClassInitializer): void;
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
			node.static,
			node.loc
		);
	}
	static visit(node: MethodDefinition, visitNode: VisitNodeType): void {
		visitNode(node.key);
		visitNode(node.value);
		node.decorators.forEach(visitNode);
	}
	declare protected value: FunctionExpression;
	afterInstanceConstruct: any;
	constructor(
		private kind: MethodDefinitionKind,
		key: ExpressionNode | PrivateIdentifier,
		value: FunctionExpression,
		decorators: Decorator[],
		computed: boolean,
		isStatic: boolean,
		loc?: SourceLocation) {
		super(key, decorators, computed, isStatic, value, loc);
	}
	getKind() {
		return this.kind;
	}
	getValue() {
		return this.value;
	}
	get(stack: Stack, initializer: ClassInitializer): void {
		if (this.kind === 'constructor') {
			this.initConstructor(stack, initializer);
			return;
		}
		const name: string = this.getKeyName(stack);
		const value = this.value?.get(stack);
		const attributes = this.getPropertyAttributes(value);
		if (this.isStatic() && this.isPrivate()) {
			initializer.addStaticPrivateInitializer(name, attributes);
		} else if (this.isStatic()) {
			initializer.addStaticInitializer(name, attributes);
		} else if (this.isPrivate()) {
			initializer.addPrivateInstanceMethod(name, attributes);
		} else {
			initializer.addInstanceMethod(name, attributes);
		}
	}

	private getPropertyAttributes(value: any): PropertyDescriptor & ThisType<any> {
		switch (this.kind) {
			case 'set': return {
				writable: true,
				configurable: true,
				enumerable: false,
				set: value,
			};
			case 'get': return {
				writable: true,
				configurable: true,
				enumerable: false,
				get: value,
			};
			default:
			case 'method': return {
				writable: true,
				configurable: true,
				enumerable: false,
				value: value
			};
		}
	}
	private initConstructor(stack: Stack, initializer: ClassInitializer) {
		const body = (this.value.getBody() as BlockStatement).getBody();
		let superIndex = body
			.findIndex(call => call instanceof CallExpression && call.getCallee() instanceof Super);
		const blockAfterSuper = new BlockStatement(body.slice(superIndex + 1));
		initializer.setConstructor(function (this: ClassInstance, params: any[]) {
			const scope = stack.pushBlockScope();
			blockAfterSuper.get(stack);
			stack.clearTo(scope);
		});
		if (superIndex >= 0) {
			const blockBeforeSuper = new BlockStatement(body.slice(0, superIndex));
			const superCall = body[superIndex] as CallExpression;
			const cstrExpr = this;
			initializer.setParameterResolver(function (params: any[]) {
				const scope = stack.pushBlockScope();
				cstrExpr.value.defineFunctionArguments(stack, params);
				blockBeforeSuper.get(stack);
				const parameters = superCall.getCallParameters(stack);
				stack.clearTo(scope);
				return parameters;
			});
		}
	}
	toString(): string {
		let str = this.decorators.map(decorator => decorator.toString()).join(' ');
		if (str.length) {
			str += ' ';
		}
		if (this.static) {
			str += 'static ';
		}
		const methodName = this.key.toString();
		switch (this.kind) {
			case 'get':
				str += 'get ' + methodName;
				break;
			case 'set':
				str += 'set ' + methodName;
				break;
			case 'method':
				if (this.value.getAsync() && this.value.getGenerator()) {
					str += 'async *';
				}
				else if (this.value.getAsync()) {
					str += 'async ';
				} else if (this.value.getGenerator()) {
					str += '*';
				}
				str += methodName;
				break;
			case 'constructor':
				str += 'constructor';
				break;
			default:
				break;
		}
		str += this.value.paramsAndBodyToString();
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
			node.value && deserializer(node.value),
			node.loc
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
		value?: ExpressionNode,
		loc?: SourceLocation) {
		super(key, decorators, computed, isStatic, value, loc);
	}
	get(stack: Stack, initializer: ClassInitializer): void {
		const name: string = this.getKeyName(stack);
		if (!this.isStatic()) {
			initializer.addInstanceInitializer(() => ({ isPrivate: this.isPrivate(), key: name, value: this.value?.get(stack) }));
			return;
		}
		const value = this.value?.get(stack);
		const attributes = { writable: true, configurable: true, enumerable: true, value };
		if (this.isPrivate()) {
			initializer.addStaticPrivateInitializer(name, attributes);
		} else {
			initializer.addStaticInitializer(name, attributes);
		}
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
			node.value ? deserializer(node.value) : void 0,
			node.loc
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
		value?: ExpressionNode,
		loc?: SourceLocation) {
		super(key, decorators, computed, isStatic, value, loc);
	}
	get(stack: Stack, initializer: ClassInitializer): void {
		const name: string = this.getKeyName(stack);
		const accessorAttributes = {
			writable: false,
			configurable: true,
			enumerable: false,
			set: function (this: ClassInstance, value: any) {
				this[PRIVATE_SYMBOL][name] = value;
			},
			get: function (this: ClassInstance) {
				return this[PRIVATE_SYMBOL][name];
			},
		};
		if (!this.isStatic()) {
			initializer.addInstanceInitializer(() => ({ isPrivate: true, key: name, value: this.value?.get(stack) }));
			initializer.addInstanceMethod(name, accessorAttributes);
			return;
		}
		const value = this.value?.get(stack);
		const valueAttribute = { writable: true, configurable: true, enumerable: true, value };
		initializer.addStaticInitializer(name, accessorAttributes);
		initializer.addStaticPrivateInitializer(name, valueAttribute);
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
			node.body.map(deserializer),
			node.loc
		);
	}
	static visit(node: ClassBody, visitNode: VisitNodeType): void {
		node.body.forEach(visitNode);
	}
	constructor(private body: (MethodDefinition | PropertyDefinition | AccessorProperty | StaticBlock)[],
		loc?: SourceLocation) {
		super(loc);
	}
	getBody() {
		return this.body;
	}
	set(stack: Stack, value: any) {
		throw new Error('Method not implemented.');
	}
	get(stack: Stack, initializer: ClassInitializer) {
		this.body.forEach(definition => definition.get(stack, initializer));
	}
	dependency(computed?: true): ExpressionNode[] {
		throw new Error('Method not implemented.');
	}
	dependencyPath(computed?: true): ExpressionEventPath[] {
		throw new Error('Method not implemented.');
	}
	toString(): string {
		return this.body.map(definition => `\t${definition.toString()}`).join('\n');
	}
	toJson(): { [key: string]: any; } {
		return {
			body: this.body.map(method => method.toJSON())
		};
	}
}

export class Class extends AbstractExpressionNode {
	constructor(
		protected body: ClassBody,
		protected decorators: Decorator[],
		protected id?: Identifier,
		protected superClass?: ExpressionNode,
		loc?: SourceLocation) {
		super(loc);
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
	set(stack: Stack) {
		throw new Error(`Class.#set() has no implementation.`);
	}
	get(stack: Stack) {
		// freeze stack
		stack = stack.copyStack();
		const className = this.id?.getName() as string ?? TEMP_CLASS_NAME;
		const SuperClass = this.superClass?.get(stack) as TypeOf<any> | undefined ?? class { };
		const initializer = new ClassInitializer();
		const ClassConstructor: ClassConstructor = this.createClass(SuperClass, className, initializer);

		// build class body
		stack.pushBlockScopeFor({
			'this': ClassConstructor,
			'super': SuperClass,
		});
		this.body.get(stack, initializer);
		initializer.initClass(ClassConstructor);
		return ClassConstructor;
	}

	private createClass(parentClass: TypeOf<any>, className: string | symbol, initializer: ClassInitializer) {
		const nameClassDeclaration: Record<PropertyKey, ClassConstructor> = {
			[className]: class extends parentClass {
				static [Symbol.toStringTag] = className;
				static [PRIVATE_SYMBOL]: { [key: string | number | symbol]: any } = {};
				[PRIVATE_SYMBOL]: { [key: string | number | symbol]: any } = {};
				constructor(...params: any[]) {
					const parameters = initializer.getSuperArguments(params);
					super(...parameters);
					initializer.initInstance(this);
				}
			}
		};
		return nameClassDeclaration[className];
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
		return `${decorators}${classDeclaration} {\n${this.body.toString()}\n}`;
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
			node.decorators.map(deserializer),
			deserializer(node.id),
			node.superClass && deserializer(node.superClass),
			node.loc
		);
	}
	static visit(node: ClassDeclaration, visitNode: VisitNodeType): void {
		visitNode(node.body);
		node.decorators.forEach(visitNode);
		visitNode(node.id);
		node.superClass && visitNode(node.superClass);
	}
	declare protected id: Identifier;
	constructor(
		body: ClassBody,
		decorators: Decorator[],
		id: Identifier,
		superClass?: ExpressionNode,
		loc?: SourceLocation) {
		super(body, decorators, id, superClass, loc);
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
			node.decorators.map(deserializer),
			node.id && deserializer(node.id),
			node.superClass && deserializer(node.superClass),
			node.loc
		);
	}
	static visit(node: ClassExpression, visitNode: VisitNodeType): void {
		visitNode(node.body);
		node.decorators.forEach(visitNode);
		node.id && visitNode(node.id);
		node.superClass && visitNode(node.superClass);
	}

	constructor(
		body: ClassBody,
		decorators: Decorator[],
		id?: Identifier,
		superClass?: ExpressionNode,
		loc?: SourceLocation) {
		super(body, decorators, id, superClass, loc);
	}

}
