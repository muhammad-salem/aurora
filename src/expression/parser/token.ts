
import type { ExpressionNode } from '../api/expression.js';

export enum TokenType {
	STRING = 'STRING',
	NUMBER = 'NUMBER',
	BOOLEAN = 'BOOLEAN',
	NULLISH = 'NULLISH',
	REGEXP = 'REGEXP',
	BIGINT = 'BIGINT',
	PROPERTY = 'PROPERTY',

	OBJECT = 'OBJECT',
	ARRAY = 'ARRAY',

	OPEN_PARENTHESES = 'OPEN_PARENTHESES',
	CLOSE_PARENTHESES = 'CLOSE_PARENTHESES',
	OPEN_BRACKETS = 'OPEN_BRACKETS',
	CLOSE_BRACKETS = 'CLOSE_BRACKETS',
	OPEN_CURLY = 'OPEN_CURLY',
	CLOSE_CURLY = 'CLOSE_CURLY',

	COMMA = 'COMMA',
	SEMICOLON = 'SEMICOLON',

	OPERATOR = 'OPERATOR',
	STATEMENT = 'STATEMENT',

	EOF = 'EOF',
	NS = 'NOT_SUPPORTED',

	/** had been converted to Expression Node */
	EXPRESSION = 'EXPRESSION'
}

export namespace TokenType {
	export function isPair(type: TokenType): boolean {
		switch (type) {
			case TokenType.OPEN_PARENTHESES:
			case TokenType.OPEN_BRACKETS:
			case TokenType.OPEN_CURLY:
			case TokenType.CLOSE_CURLY:
			case TokenType.CLOSE_BRACKETS:
			case TokenType.CLOSE_PARENTHESES:
				return true;
			default:
				return false;
		}
	}
	export function isOpenPair(type: TokenType): boolean {
		switch (type) {
			case TokenType.OPEN_PARENTHESES:
			case TokenType.OPEN_BRACKETS:
			case TokenType.OPEN_CURLY:
				return true;
			default:
				return false;
		}
	}
	export function isClosePair(type: TokenType): boolean {
		switch (type) {
			case TokenType.CLOSE_CURLY:
			case TokenType.CLOSE_BRACKETS:
			case TokenType.CLOSE_PARENTHESES:
				return true;
			default:
				return false;
		}
	}
	export function openOf(type: TokenType): TokenType {
		switch (type) {
			case TokenType.CLOSE_CURLY:
				return TokenType.OPEN_CURLY;
			case TokenType.CLOSE_BRACKETS:
				return TokenType.OPEN_BRACKETS;
			case TokenType.CLOSE_PARENTHESES:
				return TokenType.OPEN_PARENTHESES;
		}
		return type;
	}
	export function closeOf(type: TokenType): TokenType {
		switch (type) {
			case TokenType.OPEN_CURLY:
				return TokenType.CLOSE_CURLY;
			case TokenType.OPEN_BRACKETS:
				return TokenType.CLOSE_BRACKETS;
			case TokenType.OPEN_PARENTHESES:
				return TokenType.CLOSE_PARENTHESES;
		}
		return type;
	}
}

export class Token {
	constructor(public type: TokenType, public value: string | ExpressionNode) { }
	isEqual(type: TokenType, value: string | ExpressionNode) {
		return this.type === type && this.value === value;
	}
	isTypeOf(type: TokenType) {
		return this.type === type;
	}
	isValueOf(value: string | ExpressionNode) {
		return this.value === value;
	}
	valueAsExpression(): ExpressionNode {
		if (!this.isPropOrExp()) {
			throw new Error(`token value is not ExpressionNode`);
		}
		return this.value as ExpressionNode;
	}
	valueAsString(): string {
		if (typeof this.value !== 'string') {
			throw new Error(`token value is not string`);
		}
		return this.value as string;
	}
	isValue(): boolean {
		switch (this.type) {
			case TokenType.STRING:
			case TokenType.NUMBER:
			case TokenType.BOOLEAN:
			case TokenType.NULLISH:
			case TokenType.REGEXP:
			case TokenType.BIGINT:
			case TokenType.PROPERTY:
			case TokenType.OBJECT:
			case TokenType.ARRAY:
				return true;
			default:
				return false;
		}
	}
	isEndOfStatement(): boolean {
		switch (this.type) {
			case TokenType.SEMICOLON:
			case TokenType.COMMA:
			case TokenType.CLOSE_PARENTHESES:
			case TokenType.CLOSE_BRACKETS:
			case TokenType.CLOSE_CURLY:
			case TokenType.EOF:
				return true;
			default:
				return false;
		}
	}
	isOperator(): boolean {
		switch (this.type) {
			case TokenType.OPERATOR:
				return true;
			default:
				return false;
		}
	}
	isStatement(): boolean {
		switch (this.type) {
			case TokenType.STATEMENT:
				return true;
			default:
				return false;
		}
	}
	isFunctionCall(): boolean {
		switch (this.type) {
			case TokenType.CLOSE_BRACKETS:
			case TokenType.CLOSE_PARENTHESES:
			case TokenType.PROPERTY:
				return true;
			default:
				return false;
		}
	}
	isPropOrExp(): boolean {
		switch (this.type) {
			case TokenType.STRING:
			case TokenType.NUMBER:
			case TokenType.BOOLEAN:
			case TokenType.NULLISH:
			case TokenType.REGEXP:
			case TokenType.BIGINT:
			case TokenType.PROPERTY:
			case TokenType.OBJECT:
			case TokenType.ARRAY:
			case TokenType.PROPERTY:
			case TokenType.EXPRESSION:
				return true;
			default:
				return false;
		}
	}
	isEofSmCP(): boolean {
		switch (this.type) {
			case TokenType.EOF:
			case TokenType.SEMICOLON:
			case TokenType.CLOSE_PARENTHESES:
				return true;
			default:
				return false;
		}
	}
	toString(): string {
		return this.type + ': ' + String(this.value);
	}
}
