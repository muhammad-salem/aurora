
import { Deserializer } from '../deserialize/deserialize.js';
import { AbstractExpressionNode } from '../abstract.js';
import { ScopedStack } from '../scope.js';

@Deserializer('property')
export class PropertyNode extends AbstractExpressionNode {
	static fromJSON(node: PropertyNode): PropertyNode {
		return new PropertyNode(node.property);
	}
	constructor(private property: string | number) {
		super();
	}
	set(stack: ScopedStack, value: any) {
		return stack.set(this.property, value) ? value : void 0;
	}
	get(stack: ScopedStack) {
		return stack.get(this.property);
	}
	entry(): string[] {
		return [this.toString()];
	}
	event(): string[] {
		return [this.toString()];
	}
	toString(): string {
		return String(this.property);
	}
	toJson(): object {
		return { property: this.property };
	}
}

export abstract class AbstractValueNode<T> extends AbstractExpressionNode {
	protected value: T;
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
export class StringNode extends AbstractValueNode<string> {
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
		}
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

@Deserializer('number')
export class NumberNode extends AbstractValueNode<number> {
	static fromJSON(node: NumberNode): NumberNode {
		return new NumberNode(node.value);
	}
	constructor(value: number) {
		super();
		this.value = value;
	}
}

@Deserializer('bigint')
export class BigIntNode extends AbstractValueNode<bigint> {
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
export class RegExpNode extends AbstractValueNode<RegExp> {
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
export class BooleanNode extends AbstractValueNode<boolean> {
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
export class NullishNode extends AbstractValueNode<null | undefined> {
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
export const ThisNode = Object.freeze(new PropertyNode('this')) as PropertyNode;
export const SymbolNode = Object.freeze(new PropertyNode('Symbol')) as PropertyNode;
