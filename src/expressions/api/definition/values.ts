import type { CanDeclareVariable, ExpressionNode, NodeDeserializer } from '../expression.js';
import type { ScopeType } from '../../scope/scope.js';
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
export class Identifier extends AbstractExpressionNode implements CanDeclareVariable {
	static fromJSON(node: Identifier): Identifier {
		return new Identifier(node.name);
	}
	constructor(private name: string | number) {
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
	declareVariable(stack: Stack, scopeType: ScopeType, propertyValue: any): any {
		return stack.declareVariable(scopeType, this.name, propertyValue);
	}
	entry(): string[] {
		return [this.toString()];
	}
	event(parent?: string): string[] {
		if (parent) {
			return [parent + this.toString()];
		}
		return [this.toString()];
	}
	toString(): string {
		return String(this.name);
	}
	toJson(): object {
		return { name: this.name };
	}
}

@Deserializer('Literal')
export class Literal<T> extends AbstractExpressionNode {
	static fromJSON(node: Literal<any>):
		Literal<string>
		| Literal<number>
		| Literal<bigint>
		| Literal<boolean>
		| Literal<RegExp>
		| Literal<null | undefined> {
		return new Literal(node.value);
	}
	constructor(protected value: T) {
		super();
	}
	getValue() {
		return this.value;
	}
	set() {
		throw new Error(`${this.constructor.name}#set() has no implementation.`);
	}
	get(): T {
		return this.value;
	}
	entry(): string[] {
		return [];
	}
	event(): string[] {
		return [];
	}
	toString(): string {
		return String(this.value);
	}
	toJson(): object {
		return { value: this.value };
	}
}

@Deserializer('StringLiteral')
export class StringLiteral extends Literal<string> {
	static fromJSON(node: StringLiteral): StringLiteral {
		return new StringLiteral(node.value, node.quote);
	}
	private quote: string;
	constructor(value: string, quote?: string) {
		super(value);
		const firstChar = value.charAt(0);
		if (quote) {
			this.quote = quote;
			this.value = value;
		} else if (firstChar === '"' || firstChar == `'` || firstChar === '`') {
			this.quote = firstChar;
			this.value = `"${value.substring(1, value.length - 1)}"`;
		} else {
			this.quote = '';
			this.value = value;
		}
	}
	getQuote() {
		return this.quote;
	}
	toString(): string {
		return `${this.quote}${this.value}${this.quote}`;
	}
	toJson(): object {
		return {
			value: this.value,
			quote: this.quote
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
	constructor(private quasis: string[], private expressions: ExpressionNode[], private tag?: ExpressionNode,) {
		super();
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
	entry(): string[] {
		return this.expressions.flatMap(expr => expr.entry());
	}
	event(): string[] {
		return this.expressions.flatMap(expr => expr.event());
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
	constructor(quasis: string[], expressions: ExpressionNode[]) {
		super(quasis, expressions);
	}
}

@Deserializer('TaggedTemplateExpression')
export class TaggedTemplateExpression extends TemplateLiteralExpressionNode {
	constructor(tag: ExpressionNode, quasis: string[], expressions: ExpressionNode[]) {
		super(quasis, expressions, tag);
	}
}


@Deserializer('NumberLiteral')
export class NumberLiteral extends Literal<number> {
	static fromJSON(node: NumberLiteral): NumberLiteral {
		return new NumberLiteral(node.value);
	}
	constructor(value: number) {
		super(value);
	}
}

@Deserializer('BigIntLiteral')
export class BigIntLiteral extends Literal<bigint> {
	static fromJSON(node: BigIntLiteral): BigIntLiteral {
		return new BigIntLiteral(BigInt(String(node.value)));
	}
	toString(): string {
		return `${this.value}n`;
	}
	toJson(): object {
		return { value: this.value.toString() };
	}
}
@Deserializer('RegExpLiteral')
export class RegExpLiteral extends Literal<RegExp> {
	static fromJSON(node: RegExpLiteral & { regex: { pattern: string, flags: string } }): RegExpLiteral {
		return new RegExpLiteral(new RegExp(node.regex.pattern, node.regex.flags));
	}
	toString(): string {
		return `${this.value}n`;
	}
	toJson(): object {
		return {
			regex: {
				pattern: this.value.source,
				flags: this.value.flags
			}
		};;
	}
}

export const TRUE = String(true);
export const FALSE = String(false);
@Deserializer('BooleanLiteral')
export class BooleanLiteral extends Literal<boolean> {
	static fromJSON(node: BooleanLiteral): BooleanLiteral {
		switch (String(node.value)) {
			case TRUE: return TrueNode;
			case FALSE:
			default:
				return FalseNode;
		}
	}
}

export const NULL = String(null);
export const UNDEFINED = String(undefined);

@Deserializer('NullishLiteral')
export class NullishLiteral extends Literal<null | undefined> {
	static fromJSON(node: NullishLiteral): NullishLiteral {
		switch (String(node.value)) {
			case NULL: return NullNode;
			case UNDEFINED:
			default: return UndefinedNode;
		}
	}

	toString(): string {
		if (typeof this.value === 'undefined') {
			return UNDEFINED;
		}
		return NULL;
	}
	toJson(): object {
		return { value: this.toString() };
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

export const NullNode = Object.freeze(new NullishLiteral(null)) as NullishLiteral;
export const UndefinedNode = Object.freeze(new NullishLiteral(undefined)) as NullishLiteral;
export const TrueNode = Object.freeze(new BooleanLiteral(true)) as BooleanLiteral;
export const FalseNode = Object.freeze(new BooleanLiteral(false)) as BooleanLiteral;
export const ThisNode = Object.freeze(new ThisExpression()) as ThisExpression;
export const GlobalThisNode = Object.freeze(new Identifier('globalThis')) as Identifier;
export const SymbolNode = Object.freeze(new Identifier('Symbol')) as Identifier;
export const OfNode = Object.freeze(new Identifier('of')) as Identifier;
export const AsNode = Object.freeze(new Identifier('as')) as Identifier;
export const GetIdentifier = Object.freeze(new Identifier('get')) as Identifier;
export const SetIdentifier = Object.freeze(new Identifier('set')) as Identifier;
export const AsyncIdentifier = Object.freeze(new Identifier('async')) as Identifier;
export const AwaitIdentifier = Object.freeze(new Identifier('await')) as Identifier;
export const ConstructorIdentifier = Object.freeze(new Identifier('constructor')) as Identifier;
export const NameIdentifier = Object.freeze(new Identifier('name')) as Identifier;
export const EvalIdentifier = Object.freeze(new Identifier('eval')) as Identifier;
export const ArgumentsIdentifier = Object.freeze(new Identifier('arguments')) as Identifier;
