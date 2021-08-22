import type { ExpressionNode, NodeDeserializer } from '../expression';
import { Deserializer } from '../deserialize/deserialize';
import { AbstractExpressionNode } from '../abstract';
import { StackProvider } from '../scope';

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
export class IdentifierNode extends AbstractExpressionNode {
	static fromJSON(node: IdentifierNode): IdentifierNode {
		return new IdentifierNode(node.name);
	}
	constructor(private name: string | number) {
		super();
	}
	getName() {
		return this.name;
	}
	set(stack: StackProvider, value: any) {
		return stack.set(this.name, value) ? value : void 0;
	}
	get(stack: StackProvider, thisContext?: any) {
		if (thisContext) {
			return thisContext[this.name];
		}
		return stack.get(this.name);
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
export class AbstractLiteralNode<T> extends AbstractExpressionNode {
	static fromJSON(node: AbstractLiteralNode<any>):
		AbstractLiteralNode<string>
		| AbstractLiteralNode<number>
		| AbstractLiteralNode<bigint>
		| AbstractLiteralNode<boolean>
		| AbstractLiteralNode<RegExp>
		| AbstractLiteralNode<null | undefined> {
		return new AbstractLiteralNode(node.value);
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
export class StringNode extends AbstractLiteralNode<string> {
	static fromJSON(node: StringNode): StringNode {
		return new StringNode(node.value, node.quote);
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

	set(stack: StackProvider, value: any) {
		throw new Error(`TemplateLiteralExpressionNode#set() has no implementation.`);
	}
	get(stack: StackProvider) {
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
export class TemplateLiteralNode extends TemplateLiteralExpressionNode {
	constructor(quasis: string[], expressions: ExpressionNode[]) {
		super(quasis, expressions);
	}
}

@Deserializer('TaggedTemplateExpression')
export class TaggedTemplateExpressionNode extends TemplateLiteralExpressionNode {
	constructor(tag: ExpressionNode, quasis: string[], expressions: ExpressionNode[]) {
		super(quasis, expressions, tag);
	}
}


@Deserializer('NumberLiteral')
export class NumberNode extends AbstractLiteralNode<number> {
	static fromJSON(node: NumberNode): NumberNode {
		return new NumberNode(node.value);
	}
	constructor(value: number) {
		super(value);
	}
}

@Deserializer('BigIntLiteral')
export class BigIntNode extends AbstractLiteralNode<bigint> {
	static fromJSON(node: BigIntNode): BigIntNode {
		return new BigIntNode(BigInt(String(node.value)));
	}
	toString(): string {
		return `${this.value}n`;
	}
	toJson(): object {
		return { value: this.value.toString() };
	}
}
@Deserializer('RegExpLiteral')
export class RegExpNode extends AbstractLiteralNode<RegExp> {
	static fromJSON(node: RegExpNode & { regex: { pattern: string, flags: string } }): RegExpNode {
		return new RegExpNode(new RegExp(node.regex.pattern, node.regex.flags));
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
export class BooleanNode extends AbstractLiteralNode<boolean> {
	static fromJSON(node: BooleanNode): BooleanNode {
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
export class NullishNode extends AbstractLiteralNode<null | undefined> {
	static fromJSON(node: NullishNode): NullishNode {
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
export class ThisExpressionNode extends IdentifierNode {
	static fromJSON(node: ThisExpressionNode): ThisExpressionNode {
		return ThisNode;
	}
	constructor() {
		super('this');
	}
}

export const NullNode = Object.freeze(new NullishNode(null)) as NullishNode;
export const UndefinedNode = Object.freeze(new NullishNode(undefined)) as NullishNode;
export const TrueNode = Object.freeze(new BooleanNode(true)) as BooleanNode;
export const FalseNode = Object.freeze(new BooleanNode(false)) as BooleanNode;
export const ThisNode = Object.freeze(new ThisExpressionNode()) as ThisExpressionNode;
export const GlobalThisNode = Object.freeze(new IdentifierNode('globalThis')) as IdentifierNode;
export const SymbolNode = Object.freeze(new IdentifierNode('Symbol')) as IdentifierNode;
export const OfNode = Object.freeze(new IdentifierNode('of')) as IdentifierNode;
export const AsNode = Object.freeze(new IdentifierNode('as')) as IdentifierNode;
export const GetIdentifier = Object.freeze(new IdentifierNode('get')) as IdentifierNode;
export const SetIdentifier = Object.freeze(new IdentifierNode('set')) as IdentifierNode;
export const AsyncIdentifier = Object.freeze(new IdentifierNode('async')) as IdentifierNode;
export const AwaitIdentifier = Object.freeze(new IdentifierNode('await')) as IdentifierNode;
export const ConstructorIdentifier = Object.freeze(new IdentifierNode('constructor')) as IdentifierNode;
export const NameIdentifier = Object.freeze(new IdentifierNode('name')) as IdentifierNode;
export const EvalIdentifier = Object.freeze(new IdentifierNode('eval')) as IdentifierNode;
export const ArgumentsIdentifier = Object.freeze(new IdentifierNode('arguments')) as IdentifierNode;
