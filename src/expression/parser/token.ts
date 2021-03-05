
import type { ExpressionNode } from '../api/expression.js';

export enum TokenType {
	STRING = 'STRING',
	NUMBER = 'NUMBER',
	BOOLEAN = 'BOOLEAN',
	NULLISH = 'NULLISH',
	REGEXP = 'REGEXP',
	BIGINT = 'BIGINT',
	PROPERTY = 'PROPERTY',

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

	OBJECT = 'OBJECT',
	ARRAY = 'ARRAY',

	EOF = 'EOF',
	NS = 'NOT_SUPPORTED',

	/** had been converted to Expression Node */
	EXPRESSION = 'EXPRESSION'
}

export class Token {
	constructor(public type: TokenType, public value: string | ExpressionNode) { }
	getExpressionNode(): ExpressionNode {
		if (this.type !== TokenType.EXPRESSION) {
			throw new Error(`can't convert to ExpressionNode`);
		}
		return this.value as ExpressionNode;
	}
	toString(): string {
		return this.type + ': ' + String(this.value);
	}
}
