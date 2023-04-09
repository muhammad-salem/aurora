import type {
	DeclarationExpression, ExpressionNode, NodeDeserializer,
	CanFindScope, ExpressionEventPath, VisitNodeType, SourceLocation
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
		return new Identifier(node.name, node.range, node.loc);
	}
	constructor(protected name: string | number, range?: [number, number], loc?: SourceLocation) {
		super(range, loc);
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
		return new ThisExpression(node.range, node.loc);
	}
	constructor(
		range?: [number, number],
		loc?: SourceLocation) {
		super('this', range, loc);
	}
	toJson(): object {
		return {};
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
			return new Literal(BigInt(node.bigint), node.raw, undefined, node.bigint, node.range, node.loc);
		} else if (node.regex) {
			return new Literal(RegExp(node.regex.pattern, node.regex.flags), node.raw, node.regex, undefined, node.range, node.loc);
		}
		return new Literal(node.value, node.raw, undefined, undefined, node.range, node.loc);
	}
	declare type: 'Literal';
	regex?: { pattern: string, flags: string };
	bigint?: string;
	raw?: string
	constructor(
		public value: T,
		raw?: string,
		regex?: { pattern: string, flags: string },
		bigint?: string,
		range?: [number, number],
		loc?: SourceLocation) {
		super(range, loc);
		raw && (this.raw = raw);
		regex && (this.regex = regex);
		bigint && (this.bigint = bigint);
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
	static visit(node: TemplateLiteralExpressionNode, visitNode: VisitNodeType): void {
		node.tag && visitNode(node.tag);
		node.expressions.forEach(visitNode);
	}
	constructor(
		protected quasis: string[],
		protected expressions: ExpressionNode[],
		protected tag?: ExpressionNode,
		range?: [number, number],
		loc?: SourceLocation) {
		super(range, loc);
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
	static fromJSON(node: TemplateLiteral, deserializer: NodeDeserializer): TemplateLiteralExpressionNode {
		return new TemplateLiteral(
			node.quasis,
			node.expressions.map(deserializer),
			node.range,
			node.loc
		);
	}
	declare protected tag: undefined;
	constructor(
		quasis: string[],
		expressions: ExpressionNode[],
		range?: [number, number],
		loc?: SourceLocation) {
		super(quasis, expressions, undefined, range, loc);
	}
	override getTag(): undefined {
		return undefined;
	}
}

@Deserializer('TaggedTemplateExpression')
export class TaggedTemplateExpression extends TemplateLiteralExpressionNode {
	static fromJSON(node: TaggedTemplateExpression, deserializer: NodeDeserializer): TemplateLiteralExpressionNode {
		return new TaggedTemplateExpression(
			deserializer(node.tag),
			node.quasis,
			node.expressions.map(deserializer),
			node.range,
			node.loc
		);
	}
	declare protected tag: ExpressionNode;
	constructor(
		tag: ExpressionNode,
		quasis: string[],
		expressions: ExpressionNode[],
		range?: [number, number],
		loc?: SourceLocation) {
		super(quasis, expressions, tag, range, loc);
	}
	override getTag(): ExpressionNode {
		return super.getTag()!;
	}
}
