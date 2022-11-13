import type {
	DeclarationExpression, ExpressionNode, NodeDeserializer,
	CanFindScope, ExpressionEventPath, VisitNodeType
} from '../expression.js';
import type { Context, Scope } from '../../scope/scope.js';
import type { Stack } from '../../scope/stack.js';
import { Deserializer } from '../deserialize/deserialize.js';
import { AbstractExpressionNode } from '../abstract.js';

/**
 * An identifier is a sequence of characters in the code that identifies a variable, function, or property.
 * In JavaScript, identifiers are case-sensitive and can contain Unicode letters, $, _, and digits (0-9),
 * but may not start with a digit.
 * An identifier differs from a string in that a string is data,
 * while an identifier is part of the code. In JavaScript,
 * there is no way to convert identifiers to strings,
 * but sometimes it is possible to parse strings into identifiers.
 */
@Deserializer('Identifier')
export class Identifier extends AbstractExpressionNode implements DeclarationExpression, CanFindScope {
	static fromJSON(node: Identifier): Identifier {
		return new Identifier(node.name);
	}
	constructor(protected name: string | number) {
		super();
	}
	getName() {
		return this.name;
	}
	set(stack: Stack, value: any) {
		return stack.set(this.name, value) ? value : void 0;
	}
	get(stack: Stack, thisContext?: any) {
		if (thisContext) {
			return thisContext[this.name];
		}
		return stack.get(this.name);
	}
	findScope<T extends object>(stack: Stack): Scope<T>;
	findScope<T extends object>(stack: Stack, scope: Scope<any>): Scope<T>;
	findScope<T extends object>(stack: Stack, scope?: Scope<any>): Scope<T> | undefined {
		if (scope) {
			return scope.getInnerScope(this.name);
		}
		scope = stack.findScope(this.name);
		return scope.getInnerScope(this.name);
	}
	declareVariable(stack: Stack, propertyValue: any): any {
		return stack.declareVariable(this.name, propertyValue);
	}
	getDeclarationName(): string {
		return this.toString();
	}
	dependency(computed?: true): ExpressionNode[] {
		return [this];
	}
	dependencyPath(computed?: true): ExpressionEventPath[] {
		const path: ExpressionEventPath[] = [{ computed: false, path: this.toString() }];
		return computed ? [{ computed, path: this.toString(), computedPath: [path] }] : path;
	}
	toString(): string {
		return String(this.name);
	}
	toJson(): object {
		return { name: this.name };
	}
}

@Deserializer('ThisExpression')
export class ThisExpression extends Identifier {
	static fromJSON(node: ThisExpression): ThisExpression {
		return ThisNode;
	}
	constructor() {
		super('this');
	}
}

@Deserializer('Literal')
export class Literal<T> extends AbstractExpressionNode implements CanFindScope {
	static fromJSON(node: Literal<any>):
		Literal<string>
		| Literal<number>
		| Literal<boolean>
		| Literal<RegExp>
		| Literal<bigint>
		| Literal<null>
		| Literal<undefined> {
		if (node.bigint) {
			return new Literal(BigInt(node.bigint), node.raw, undefined, node.bigint);
		} else if (node.regex) {
			return new Literal(RegExp(node.regex.pattern, node.regex.flags), node.raw, node.regex);
		}
		return new Literal(node.value, node.raw);
	}
	protected regex?: { pattern: string, flags: string };
	protected bigint?: string;
	protected raw?: string
	constructor(protected value: T, raw?: string, regex?: { pattern: string, flags: string }, bigint?: string) {
		super();
		if (raw) {
			this.raw = raw;
		}
		if (regex) {
			this.regex = regex;
		}
		if (bigint) {
			this.bigint = bigint;
		}
	}
	getValue() {
		return this.value;
	}
	getRegex() {
		return this.regex;
	}
	getBigint() {
		return this.bigint;
	}
	geRaw() {
		return this.raw;
	}
	set() {
		throw new Error(`${this.constructor.name}#set() has no implementation.`);
	}
	get(): T {
		return this.value;
	}
	findScope<V extends Context>(stack: Stack): Scope<V>;
	findScope<V extends Context>(stack: Stack, scope: Scope<Record<PropertyKey, V>>): Scope<V>;
	findScope<V extends Context>(stack: Stack, scope?: Scope<Record<PropertyKey, V>>): Scope<V> | undefined {
		if (scope) {
			return scope.getInnerScope(this.value as any);
		}
		scope = stack.findScope(this.value as any);
		return scope.getInnerScope(this.value as any);
	}
	dependency(computed: true): ExpressionNode[] {
		return computed ? [this] : [];
	}
	dependencyPath(computed?: true): ExpressionEventPath[] {
		return computed ? [{ computed: false, path: this.toString() }] : [];
	}
	toString(): string {
		return this.raw ?? String(this.value);
	}
	toJson(): object {
		if (this.bigint) {
			return {
				bigint: this.bigint,
				raw: this.raw,
			};
		} else if (this.regex) {
			return {
				regex: { pattern: this.regex?.pattern, flags: this.regex?.flags },
				raw: this.raw,
			};
		}
		return {
			value: this.value,
			raw: this.raw,
		};
	}
}

class TemplateArray extends Array<string> implements TemplateStringsArray {
	raw: readonly string[];
	constructor(strings: string[]) {
		super(...strings);
		this.raw = strings;
	}
}

export class TemplateLiteralExpressionNode extends AbstractExpressionNode {
	static fromJSON(node: TemplateLiteralExpressionNode, deserializer: NodeDeserializer): TemplateLiteralExpressionNode {
		return new TemplateLiteralExpressionNode(
			node.quasis,
			node.expressions.map(deserializer),
			node.tag ? deserializer(node.tag) : void 0
		);
	}
	static visit(node: TemplateLiteralExpressionNode, visitNode: VisitNodeType): void {
		node.tag && visitNode(node.tag);
		node.expressions.forEach(visitNode);
	}
	constructor(protected quasis: string[], protected expressions: ExpressionNode[], protected tag?: ExpressionNode,) {
		super();
	}
	getTag() {
		return this.tag;
	}
	getExpressions() {
		return this.expressions;
	}
	set(stack: Stack, value: any) {
		throw new Error(`TemplateLiteralExpressionNode#set() has no implementation.`);
	}
	get(stack: Stack) {
		const tagged: Function = this.tag?.get(stack) || String.raw;
		const templateStringsArray = new TemplateArray(this.quasis);
		templateStringsArray.raw = templateStringsArray;
		const values = this.expressions.map(expr => expr.get(stack));
		return tagged(templateStringsArray, ...values);
	}
	dependency(computed?: true): ExpressionNode[] {
		return this.expressions.flatMap(exp => exp.dependency(computed));
	}
	dependencyPath(computed?: true): ExpressionEventPath[] {
		return this.expressions.flatMap(exp => exp.dependencyPath(computed));
	}
	toString(): string {
		let str = this.tag?.toString() || '';
		str += '`';
		let i = 0;
		for (; i < this.quasis.length - 1; i++) {
			str += this.quasis[i];
			str += '${';
			str += this.expressions[i].toString();
			str += '}';
		}
		str += this.quasis[i];
		str += '`';
		return str;
	}
	toJson(): object {
		return {
			quasis: this.quasis,
			expressions: this.expressions.map(expr => expr.toJSON()),
			tag: this.tag?.toJSON(),
		};
	}
}

@Deserializer('TemplateLiteral')
export class TemplateLiteral extends TemplateLiteralExpressionNode {
	declare protected tag: undefined;
	constructor(quasis: string[], expressions: ExpressionNode[]) {
		super(quasis, expressions);
	}
	override getTag(): undefined {
		return undefined;
	}
}

@Deserializer('TaggedTemplateExpression')
export class TaggedTemplateExpression extends TemplateLiteralExpressionNode {
	declare protected tag: ExpressionNode;
	constructor(tag: ExpressionNode, quasis: string[], expressions: ExpressionNode[]) {
		super(quasis, expressions, tag);
	}
	override getTag(): ExpressionNode {
		return super.getTag()!;
	}
}


export const TRUE = String(true);
export const FALSE = String(false);

export const NULL = String(null);
export const UNDEFINED = String(undefined);

export const NullNode = Object.freeze(new Literal<null>(null)) as Literal<null>;
export const UndefinedNode = Object.freeze(new Literal<undefined>(undefined)) as Literal<undefined>;
export const TrueNode = Object.freeze(new Literal<boolean>(true)) as Literal<boolean>;
export const FalseNode = Object.freeze(new Literal<boolean>(false)) as Literal<boolean>;
export const ThisNode = Object.freeze(new ThisExpression()) as ThisExpression;
export const GlobalThisNode = Object.freeze(new Identifier('globalThis')) as Identifier;
export const SymbolNode = Object.freeze(new Identifier('Symbol')) as Identifier;
export const OfNode = Object.freeze(new Identifier('of')) as Identifier;
export const AsNode = Object.freeze(new Identifier('as')) as Identifier;
export const DefaultNode = Object.freeze(new Identifier('default')) as Identifier;
export const GetIdentifier = Object.freeze(new Identifier('get')) as Identifier;
export const SetIdentifier = Object.freeze(new Identifier('set')) as Identifier;
export const AsyncIdentifier = Object.freeze(new Identifier('async')) as Identifier;
export const AwaitIdentifier = Object.freeze(new Identifier('await')) as Identifier;
export const ConstructorIdentifier = Object.freeze(new Identifier('constructor')) as Identifier;
export const NameIdentifier = Object.freeze(new Identifier('name')) as Identifier;
export const EvalIdentifier = Object.freeze(new Identifier('eval')) as Identifier;
export const ArgumentsIdentifier = Object.freeze(new Identifier('arguments')) as Identifier;
export const YieldIdentifier = Object.freeze(new Identifier('yield')) as Identifier;
export const SuperIdentifier = Object.freeze(new Identifier('super')) as Identifier;
export const LetIdentifier = Object.freeze(new Identifier('let')) as Identifier;
