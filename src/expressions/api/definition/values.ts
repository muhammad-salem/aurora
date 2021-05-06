import type { ExpressionNode, NodeDeserializer } from '../expression.js';
import { Deserializer } from '../deserialize/deserialize.js';
import { AbstractExpressionNode } from '../abstract.js';
import { ScopedStack } from '../scope.js';

@Deserializer('identifier')
export class IdentifierNode extends AbstractExpressionNode {
	static fromJSON(node: IdentifierNode): IdentifierNode {
		return new IdentifierNode(node.property);
	}
	constructor(private property: string | number) {
		super();
	}
	getProperty() {
		return this.property;
	}
	set(stack: ScopedStack, value: any) {
		return stack.set(this.property, value) ? value : void 0;
	}
	get(stack: ScopedStack, thisContext?: any) {
		if (thisContext) {
			return thisContext[this.property];
		}
		return stack.get(this.property);
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
		return String(this.property);
	}
	toJson(): object {
		return { property: this.property };
	}
}

export abstract class AbstractLiteralNode<T> extends AbstractExpressionNode {
	protected value: T;
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

@Deserializer('string')
export class StringNode extends AbstractLiteralNode<string> {
	static fromJSON(node: StringNode): StringNode {
		return new StringNode(node.value, node.quote);
	}
	private quote: string;
	constructor(value: string, quote?: string) {
		super();
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

@Deserializer('template')
export class TemplateLiteralsNode extends AbstractExpressionNode {
	static fromJSON(node: TemplateLiteralsNode, deserializer: NodeDeserializer): TemplateLiteralsNode {
		return new TemplateLiteralsNode(
			deserializer(node.tag),
			node.strings,
			node.expressions.map(deserializer)
		);
	}
	constructor(private tag: ExpressionNode, private strings: string[], private expressions: ExpressionNode[]) {
		super();
	}

	set(stack: ScopedStack, value: any) {
		throw new Error(`TemplateLiteralsNode#set() has no implementation.`);
	}
	get(stack: ScopedStack) {
		const tagged: Function = this.tag.get(stack);
		const templateStringsArray = new TemplateArray(this.strings);
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
		let str = this.tag.toString();
		if (str === 'String.raw') {
			str = ``;
		}
		str += '`';
		let i = 0;
		for (; i < this.strings.length - 1; i++) {
			str += this.strings[i];
			str += '${';
			str += this.expressions[i].toString();
			str += '}';
		}
		str += this.strings[i];
		str += '`';
		return str;
	}
	toJson(): object {
		return {
			tag: this.tag.toJSON(),
			strings: this.strings,
			expressions: this.expressions.map(expr => expr.toJSON())
		};
	}
}


@Deserializer('number')
export class NumberNode extends AbstractLiteralNode<number> {
	static fromJSON(node: NumberNode): NumberNode {
		return new NumberNode(node.value);
	}
	constructor(value: number) {
		super();
		this.value = value;
	}
}

@Deserializer('bigint')
export class BigIntNode extends AbstractLiteralNode<bigint> {
	static fromJSON(node: BigIntNode): BigIntNode {
		return new BigIntNode(BigInt(String(node.value)));
	}
	constructor(value: bigint) {
		super();
		this.value = value;
	}
	toString(): string {
		return `${this.value}n`;
	}
	toJson(): object {
		return { value: this.value.toString() };
	}
}
@Deserializer('regexp')
export class RegExpNode extends AbstractLiteralNode<RegExp> {
	static fromJSON(node: RegExpNode & { source: string, flags: string }): RegExpNode {
		return new RegExpNode(new RegExp(node.source, node.flags));
	}
	constructor(value: RegExp) {
		super();
		this.value = value;
	}
	toString(): string {
		return `${this.value}n`;
	}
	toJson(): object {
		return {
			source: this.value.source,
			flags: this.value.flags
		};
	}
}

export const TRUE = String(true);
export const FALSE = String(false);
@Deserializer('boolean')
export class BooleanNode extends AbstractLiteralNode<boolean> {
	static fromJSON(node: BooleanNode): BooleanNode {
		switch (String(node.value)) {
			case TRUE: return TrueNode;
			case FALSE:
			default:
				return FalseNode;
		}
	}
	constructor(value: boolean) {
		super();
		this.value = value;
	}
}

export const NULL = String(null);
export const UNDEFINED = String(undefined);

@Deserializer('nullish')
export class NullishNode extends AbstractLiteralNode<null | undefined> {
	static fromJSON(node: NullishNode): NullishNode {
		switch (String(node.value)) {
			case NULL: return NullNode;
			case UNDEFINED:
			default: return UndefinedNode;
		}
	}
	constructor(value: null | undefined) {
		super();
		this.value = value;
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

export const NullNode = Object.freeze(new NullishNode(null)) as NullishNode;
export const UndefinedNode = Object.freeze(new NullishNode(undefined)) as NullishNode;
export const TrueNode = Object.freeze(new BooleanNode(true)) as BooleanNode;
export const FalseNode = Object.freeze(new BooleanNode(false)) as BooleanNode;
export const ThisNode = Object.freeze(new IdentifierNode('this')) as IdentifierNode;
export const GlobalThisNode = Object.freeze(new IdentifierNode('globalThis')) as IdentifierNode;
export const SymbolNode = Object.freeze(new IdentifierNode('Symbol')) as IdentifierNode;
export const OfNode = Object.freeze(new IdentifierNode('of')) as IdentifierNode;
export const AsNode = Object.freeze(new IdentifierNode('as')) as IdentifierNode;
export const GetIdentifier = Object.freeze(new IdentifierNode('get')) as IdentifierNode;
export const SetIdentifier = Object.freeze(new IdentifierNode('set')) as IdentifierNode;
export const AsyncIdentifier = Object.freeze(new IdentifierNode('async')) as IdentifierNode;
