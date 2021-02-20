
import type { ExpressionNode } from '../api/expression.js';
import { RegExpNode } from '../api/definition/regexp.js';
import {
	BigIntNode, FalseNode, NULL, NullNode, PropertyNode,
	SymbolNode,
	ThisNode, TRUE, TrueNode, UndefinedNode, ValueNode
} from '../api/definition/values.js';

export enum TokenType {
	NUMBER = 'NUMBER',
	STRING = 'STRING',
	BOOLEAN = 'BOOLEAN',
	NULLISH = 'NULLISH',
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
	STATEMENTS = 'STATEMENTS',
	REGEXP = 'REGEXP',

	BIGINT = 'BIGINT',

	EOF = 'EOF',
	NS = 'NOT_SUPPORTED',

	EXPRESSION = 'EXPRESSION'
}

export class Token {
	constructor(public type: TokenType, public value: string | RegExp | ExpressionNode) { }
	toLiteralExpression() {
		switch (this.type) {
			case TokenType.PROPERTY:
				this.toPropertyNode();
				break;
			case TokenType.STRING:
				this.toStringNode();
				break;
			case TokenType.REGEXP:
				this.toRegExpNode();
				break;
			case TokenType.NUMBER:
				this.toNumberNode();
				break;
			case TokenType.BIGINT:
				this.toBigIntNode();
				break;
			case TokenType.NULLISH:
				this.toNullishNode();
				break;
			case TokenType.BOOLEAN:
				this.toBooleanNode();
				break;
			default:
			// do nothing.
		}
	}
	private toPropertyNode() {
		switch (this.value) {
			case 'this':
				this.value = ThisNode;
				break;
			case 'Symbol':
				this.value = SymbolNode;
				break;
			default:
				this.value = new PropertyNode(this.value as string);
				break;
		}
		this.type = TokenType.EXPRESSION;
	}
	private toStringNode() {
		this.value = new ValueNode(this.value as string);
		this.type = TokenType.EXPRESSION;
	}
	private toRegExpNode() {
		this.value = new RegExpNode(this.value as RegExp);
		this.type = TokenType.EXPRESSION;
	}
	private toNumberNode() {
		this.value = new ValueNode(+this.value);
		this.type = TokenType.EXPRESSION;
	}
	private toBigIntNode() {
		this.value = new BigIntNode(BigInt(this.value));
		this.type = TokenType.EXPRESSION;
	}
	private toNullishNode() {
		if (this.value === NULL) {
			this.value = NullNode;
		} else {
			this.value = UndefinedNode;
		}
		this.type = TokenType.EXPRESSION;
	}
	private toBooleanNode() {
		if (this.value === TRUE) {
			this.value = TrueNode;
		} else {
			this.value = FalseNode;
		}
		this.type = TokenType.EXPRESSION;
	}

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
