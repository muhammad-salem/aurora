import type { ExpressionNode } from '../api/expression.js';
import { Token, TokenType } from './token.js';
import {
	BigIntNode, FalseNode, NullNode, NumberNode, PropertyNode,
	RegExpNode, StringNode, SymbolNode, ThisNode, TrueNode, UndefinedNode
} from '../api/definition/values.js';

const EOFToken = Object.freeze(new Token(TokenType.EOF, 'EOF', -1)) as Token;

export abstract class TokenStream {
	public static getTokenStream(source: string | Token[]): TokenStream {
		if (Array.isArray(source)) {
			return new TokenStreamer(source);
		}
		else if (typeof source === 'string') {
			return new TokenStreamImpl(source);
		}
		throw new Error(`Can't build token stream for ${source}`);
	}
	protected pos = 0;
	protected savedPosition = 0;
	protected current: Token;
	protected savedCurrent: Token;
	protected last?: Token;

	save() {
		this.savedPosition = this.pos;
		this.savedCurrent = this.current;
	}
	restore(): void {
		this.pos = this.savedPosition;
		this.current = this.savedCurrent;
		this.last = undefined;
	}
	reset(): void {
		this.pos = 0;
		this.savedPosition = 0;
		this.current = this.savedCurrent = undefined as any;
	}
	lastToken(): Token | undefined {
		return this.last;
	}
	currentToken() {
		return this.current;
	}
	seekByValue(expect: TokenType, keywords: string[]) {
		let token: Token;
		while (true) {
			token = this.next();
			if (token.type === expect && keywords.includes(token.value as string)) {
				return true;
			}
			else if (token.type === TokenType.EOF) {
				return false;
			}
		}
	}
	seekTo(expect: TokenType): boolean {
		let token: Token;
		while (true) {
			token = this.next();
			if (token.type === expect) {
				return true;
			}
			else if (token.type === TokenType.EOF) {
				return false;
			}
		}
	}
	getPos(): number {
		return this.pos;
	}
	setPos(pos: number): void {
		this.pos = pos;
		this.current = undefined as any;
	}
	getSavedPos(): number {
		return this.savedPosition;
	}
	getStreamer(expect?: TokenType): TokenStream {
		expect ??= TokenType.EOF;
		if (TokenType.isClosePair(expect)) {
			return this.getPairStreamer(TokenType.openOf(expect), expect);
		}
		return this.getStreamerTo(expect);
	}
	private getStreamerTo(expect: TokenType): TokenStream {
		const tokens: Token[] = [];
		let token: Token;
		while (true) {
			token = this.next();
			if (token.type === expect || token.type === TokenType.EOF) {
				break;
			}
			tokens.push(token);
		}
		return new TokenStreamer(tokens);
	}
	private getPairStreamer(open: TokenType, close: TokenType): TokenStream {
		// check pair
		let count = 0;
		const tokens: Token[] = [];
		let token: Token;
		while (true) {
			token = this.next();
			if (token.type === open) {
				count++;
			}
			else if (token.type === close) {
				if (count === 0) {
					break;
				}
				else if (count > 0) {
					count--;
				}
			}
			else if (token.type === TokenType.EOF) {
				break;
			}
			tokens.push(token);
		}
		return new TokenStreamer(tokens);
	}

	public toTokens(): Token[] {
		const tokens: Token[] = [];
		let token: Token;
		while (true) {
			token = this.next();
			if (token.type === TokenType.EOF) {
				break;
			}
			tokens.push(token);
		}
		return tokens;
	}

	abstract next(): Token;
}

export class TokenStreamer extends TokenStream {
	constructor(private tokens: Token[]) {
		super();
	}
	next(): Token {
		if (this.pos === this.tokens.length) {
			return EOFToken;
		}
		this.last = this.current;
		return this.current = this.tokens[this.pos++];
	}
}

export class TokenStreamImpl extends TokenStream {
	static REGEXP_FLAGS = ['g', 'i', 'm', 's', 'u', 'y'];
	static CodePointPattern = /^[0-9a-f]{4}$/i;

	constructor(private expression: string) {
		super();
	}
	private newToken(type: TokenType, value: string | ExpressionNode, index: number): Token {
		return new Token(type, value, index);
	}

	next(): Token {
		if (this.pos >= this.expression.length) {
			return EOFToken;
		}
		this.last = this.current;
		if (this.isWhitespace() || this.isComment()) {
			return this.next();
		} else if (
			this.isRadixInteger()
			|| this.isNumber()
			|| this.isRegExp()
			|| this.isString()
			|| this.isCurlY()
			|| this.isParentheses()
			|| this.isBracket()
			|| this.isComma()
			|| this.isSemicolon()
			|| this.isOperator()
			|| this.isStatement()
			|| this.isProperty()) {
			return this.current;
		} else {
			throw this.parseError('Unknown character "' + this.expression.charAt(this.pos) + '"');
		}
	}

	private isString() {
		let result = false;
		let startPos = this.pos;
		let quote = this.expression.charAt(startPos);

		if (quote === '\'' || quote === '"' || quote === '`') {
			let index = this.expression.indexOf(quote, startPos + 1);
			while (index >= 0 && this.pos < this.expression.length) {
				this.pos = index + 1;
				if (this.expression.charAt(index - 1) !== '\\') {
					const rawString = this.expression.substring(startPos + 1, index);
					const stringNode = new StringNode(this.unescape(rawString), quote);
					this.current = this.newToken(TokenType.STRING, stringNode, startPos);
					result = true;
					break;
				}
				index = this.expression.indexOf(quote, index + 1);
			}
		}
		return result;
	}

	private isParentheses() {
		const c = this.expression.charAt(this.pos);
		if (c === '(') {
			this.current = this.newToken(TokenType.OPEN_PARENTHESES, c, this.pos);
			this.pos++;
			return true;
		} else if (c === ')') {
			this.current = this.newToken(TokenType.CLOSE_PARENTHESES, c, this.pos);
			this.pos++;
			return true;
		}
		return false;
	}

	private isBracket() {
		const c = this.expression.charAt(this.pos);
		if (c === '[') {
			this.current = this.newToken(TokenType.OPEN_BRACKETS, c, this.pos);
			this.pos++;
			return true;
		} else if (c === ']') {
			this.current = this.newToken(TokenType.CLOSE_BRACKETS, c, this.pos);
			this.pos++;
			return true;
		}
		return false;
	}

	private isCurlY() {
		const c = this.expression.charAt(this.pos);
		if (c === '{') {
			this.current = this.newToken(TokenType.OPEN_CURLY, c, this.pos);
			this.pos++;
			return true;
		} else if (c === '}') {
			this.current = this.newToken(TokenType.CLOSE_CURLY, c, this.pos);
			this.pos++;
			return true;
		}
		return false;
	}

	private isComma() {
		const c = this.expression.charAt(this.pos);
		if (c === ',') {
			this.current = this.newToken(TokenType.COMMA, c, this.pos);
			this.pos++;
			return true;
		}
		return false;
	}

	private isSemicolon() {
		const c = this.expression.charAt(this.pos);
		if (c === ';') {
			this.current = this.newToken(TokenType.SEMICOLON, c, this.pos);
			this.pos++;
			return true;
		}
		return false;
	}

	private isProperty() {
		let startPos = this.pos;
		let i = startPos;
		let hasLetter = false;
		for (; i < this.expression.length; i++) {
			const c = this.expression.charAt(i);
			if (c.toUpperCase() === c.toLowerCase()) {
				if (i === this.pos && (c === '$' || c === '_')) {
					if (c === '_') {
						hasLetter = true;
					}
					continue;
				} else if (i === this.pos || !hasLetter || (c !== '_' && (c < '0' || c > '9'))) {
					break;
				}
			} else {
				hasLetter = true;
			}
		}
		if (hasLetter) {
			let str = this.expression.substring(startPos, i);
			let node: ExpressionNode;
			switch (str) {
				case 'this': node = ThisNode; break;
				case 'null': node = NullNode; break;
				case 'undefined': node = UndefinedNode; break;
				case 'true': node = TrueNode; break;
				case 'false': node = FalseNode; break;
				case 'Symbol': node = SymbolNode; break;
				default:
					node = new PropertyNode(str); break;
			}
			this.current = this.newToken(TokenType.PROPERTY, node, startPos);
			this.pos += str.length;
			return true;
		}
		return false;
	}

	private isWhitespace() {
		let r = false;
		let c = this.expression.charAt(this.pos);
		while (/\s/.test(c)) {
			r = true;
			this.pos++;
			if (this.pos >= this.expression.length) {
				break;
			}
			c = this.expression.charAt(this.pos);
		}
		return r;
	}

	private isComment() {
		const char = this.expression.charAt(this.pos);
		const nextChar = this.expression.charAt(this.pos + 1);
		if (char === '/' && nextChar === '*') {
			this.pos = this.expression.indexOf('*/' + 2) + 2;
			if (this.pos === 1) {
				this.pos = this.expression.length;
			}
			return true;
		}
		if (char === '/' && nextChar === '/') {
			this.pos = this.expression.indexOf('\n' + 2) + 1;
			if (this.pos === -1) {
				this.pos = this.expression.length;
			}
			return true;
		}
		return false;
	}

	private isRegExp() {
		const start = this.pos;
		const char = this.expression.charAt(this.pos);
		let nextChar = this.expression.charAt(this.pos + 1);
		if (char === '/' && nextChar !== '*' && nextChar !== '=') {
			let currentPos = this.pos;
			let pattern: string;
			currentPos = this.expression.indexOf('/', currentPos + 1);
			while (currentPos > this.pos && this.expression.charAt(currentPos - 1) === '//') {
				currentPos = this.expression.indexOf('/', currentPos);
			}
			if (currentPos > this.pos) {
				// case found {2} of /1/2
				pattern = this.expression.substring(this.pos + 1, currentPos);
				this.pos = currentPos;
			} else {
				return false;
			}
			let flags = '';
			while (TokenStreamImpl.REGEXP_FLAGS.indexOf((nextChar = this.expression.charAt(this.pos + 1))) > -1) {
				flags += nextChar;
				this.pos++;
			}
			const regexNode = new RegExpNode(new RegExp(pattern, flags));
			this.current = this.newToken(TokenType.REGEXP, regexNode, this.pos);
			return true;
		}
		return false;
	}

	private unescape(v: string) {
		let index = v.indexOf('\\');
		if (index < 0) {
			return v;
		}

		let buffer = v.substring(0, index);
		while (index >= 0) {
			const c = v.charAt(++index);
			switch (c) {
				case '\'':
				case '"':
				case '\\':
				case '/':
					buffer += c;
					break;

				case 'b':
					buffer += '\b';
					break;
				case 'f':
					buffer += '\f';
					break;
				case 'n':
					buffer += '\n';
					break;
				case 'r':
					buffer += '\r';
					break;
				case 't':
					buffer += '\t';
					break;
				case 'u':
					// interpret the following 4 characters as the hex of the unicode code point
					let codePoint = v.substring(index + 1, index + 5);
					if (!TokenStreamImpl.CodePointPattern.test(codePoint)) {
						throw this.parseError('Illegal escape sequence: \\u' + codePoint);
					}
					buffer += String.fromCharCode(parseInt(codePoint, 16));
					index += 4;
					break;
				default:
					throw this.parseError('Illegal escape sequence: "\\' + c + '"');
			}
			++index;
			let backslash = v.indexOf('\\', index);
			buffer += v.substring(index, backslash < 0 ? v.length : backslash);
			index = backslash;
		}

		return buffer;
	}

	private isRadixInteger() {
		let pos = this.pos;

		if (pos >= this.expression.length - 2 || this.expression.charAt(pos) !== '0') {
			return false;
		}
		++pos;

		let radix;
		let validDigit;
		if (this.expression.charAt(pos) === 'x') {
			radix = 16;
			validDigit = /^[0-9a-f]$/i;
			++pos;
		} else if (this.expression.charAt(pos) === 'b') {
			radix = 2;
			validDigit = /^[01]$/i;
			++pos;
		} else {
			return false;
		}

		let valid = false;
		let startPos = pos;

		while (pos < this.expression.length) {
			const c = this.expression.charAt(pos);
			if (validDigit.test(c)) {
				pos++;
				valid = true;
			} else {
				break;
			}
		}

		if (valid) {
			const numNode = new NumberNode(parseInt(this.expression.substring(startPos, pos), radix));
			this.current = this.newToken(TokenType.NUMBER, numNode, this.pos);
			this.pos = pos;
		}
		return valid;
	}

	private isNumber() {
		let valid = false;
		let pos = this.pos;
		let startPos = pos;
		let resetPos = pos;
		let foundDot = false;
		let foundDigits = false;
		let c;

		while (pos < this.expression.length) {
			c = this.expression.charAt(pos);
			if ((c >= '0' && c <= '9') || (!foundDot && c === '.')) {
				if (c === '.') {
					foundDot = true;
				} else {
					foundDigits = true;
				}
				pos++;
				valid = foundDigits;
			} else {
				break;
			}
		}

		if (valid) {
			resetPos = pos;
		}

		if (c === 'e' || c === 'E') {
			pos++;
			let acceptSign = true;
			let validExponent = false;
			while (pos < this.expression.length) {
				c = this.expression.charAt(pos);
				if (acceptSign && (c === '+' || c === '-')) {
					acceptSign = false;
				} else if (c >= '0' && c <= '9') {
					validExponent = true;
					acceptSign = false;
				} else {
					break;
				}
				pos++;
			}

			if (!validExponent) {
				pos = resetPos;
			}
		}

		if (valid) {
			if (this.expression.charAt(pos) === 'n') {
				const bigintNode = new BigIntNode(BigInt(this.expression.substring(startPos, pos)));
				this.current = this.newToken(TokenType.BIGINT, bigintNode, this.pos);
				pos++;
			} else {
				const numNode = new NumberNode(parseFloat(this.expression.substring(startPos, pos)));
				this.current = this.newToken(TokenType.NUMBER, numNode, this.pos);
			}
			this.pos = pos;
		} else {
			this.pos = resetPos;
		}
		return valid;
	}

	private isOperator() {
		const char = this.expression.charAt(this.pos);
		switch (char) {
			case '+':
				if (this.expression.charAt(this.pos + 1) === '+') {
					this.current = this.newToken(TokenType.OPERATOR, '++', this.pos);
					this.pos += 2;
				} else if (this.expression.charAt(this.pos + 1) === '=') {
					this.current = this.newToken(TokenType.OPERATOR, '+=', this.pos);
					this.pos += 2;
				} else {
					this.current = this.newToken(TokenType.OPERATOR, '+', this.pos);
					this.pos++;
				}
				return true;
			case '-':
				if (this.expression.charAt(this.pos + 1) === '-') {
					this.current = this.newToken(TokenType.OPERATOR, '--', this.pos);
					this.pos += 2;
				} else if (this.expression.charAt(this.pos + 1) === '=') {
					this.current = this.newToken(TokenType.OPERATOR, '-=', this.pos);
					this.pos += 2;
				} else {
					this.current = this.newToken(TokenType.OPERATOR, '-', this.pos);
					this.pos++;
				}
				return true;
			case '=':
				if (this.expression.charAt(this.pos + 1) === '=') {
					if (this.expression.charAt(this.pos + 2) === '=') {
						this.current = this.newToken(TokenType.OPERATOR, '===', this.pos);
						this.pos += 3;
					} else {
						this.current = this.newToken(TokenType.OPERATOR, '==', this.pos);
						this.pos += 2;
					}
				} else {
					this.current = this.newToken(TokenType.OPERATOR, '=', this.pos);
					this.pos++;
				}
				return true;
			case '*':
				if (this.expression.charAt(this.pos + 1) === '*') {
					if (this.expression.charAt(this.pos + 2) === '=') {
						this.current = this.newToken(TokenType.OPERATOR, '**=', this.pos);
						this.pos += 3;
					} else {
						this.current = this.newToken(TokenType.OPERATOR, '**', this.pos);
						this.pos += 2;
					}
				} else if (this.expression.charAt(this.pos + 1) === '=') {
					this.current = this.newToken(TokenType.OPERATOR, '*=', this.pos);
					this.pos += 2;
				} else {
					this.current = this.newToken(TokenType.OPERATOR, '*', this.pos);
					this.pos++;
				}
				return true;
			case '/':
				if (this.expression.charAt(this.pos + 1) === '=') {
					this.current = this.newToken(TokenType.OPERATOR, '/=', this.pos);
					this.pos += 2;
				} else {
					this.current = this.newToken(TokenType.OPERATOR, '/', this.pos);
					this.pos++;
				}
				return true;
			case '%':
				if (this.expression.charAt(this.pos + 1) === '=') {
					this.current = this.newToken(TokenType.OPERATOR, '%=', this.pos);
					this.pos += 2;
				} else {
					this.current = this.newToken(TokenType.OPERATOR, '%', this.pos);
					this.pos++;
				}
				return true;
			case '^':
				if (this.expression.charAt(this.pos + 1) === '=') {
					this.current = this.newToken(TokenType.OPERATOR, '^=', this.pos);
					this.pos += 2;
				} else {
					this.current = this.newToken(TokenType.OPERATOR, '^', this.pos);
					this.pos++;
				}
				return true;
			case '>':
				if (this.expression.charAt(this.pos + 1) === '>') {
					if (this.expression.charAt(this.pos + 2) === '>') {
						if (this.expression.charAt(this.pos + 3) === '=') {
							this.current = this.newToken(TokenType.OPERATOR, '>>>=', this.pos);
							this.pos += 4;
						} else {
							this.current = this.newToken(TokenType.OPERATOR, '>>>', this.pos);
							this.pos += 3;
						}
					} else if (this.expression.charAt(this.pos + 2) === '=') {
						this.current = this.newToken(TokenType.OPERATOR, '>>=', this.pos);
						this.pos += 3;
					} else {
						this.current = this.newToken(TokenType.OPERATOR, '>>', this.pos);
						this.pos += 2;
					}
				} else if (this.expression.charAt(this.pos + 1) === '=') {
					this.current = this.newToken(TokenType.OPERATOR, '>=', this.pos);
					this.pos += 2;
				} else {
					this.current = this.newToken(TokenType.OPERATOR, '>', this.pos);
					this.pos++;
				}
				return true;
			case '<':
				if (this.expression.charAt(this.pos + 1) === '<') {
					if (this.expression.charAt(this.pos + 2) === '=') {
						this.current = this.newToken(TokenType.OPERATOR, '<<=', this.pos);
						this.pos += 3;
					} else {
						this.current = this.newToken(TokenType.OPERATOR, '<<', this.pos);
						this.pos += 2;
					}
				} else if (this.expression.charAt(this.pos + 1) === '=') {
					if (this.expression.charAt(this.pos + 2) === '>') {
						this.current = this.newToken(TokenType.OPERATOR, '<=>', this.pos);
						this.pos += 3;
					} else {
						this.current = this.newToken(TokenType.OPERATOR, '<=', this.pos);
						this.pos += 2;
					}
				} else {
					this.current = this.newToken(TokenType.OPERATOR, '<', this.pos);
					this.pos++;
				}
				return true;
			case '|':
				if (this.expression.charAt(this.pos + 1) === '|') {
					if (this.expression.charAt(this.pos + 2) === '=') {
						this.current = this.newToken(TokenType.OPERATOR, '||=', this.pos);
						this.pos += 3;
					} else {
						this.current = this.newToken(TokenType.OPERATOR, '||', this.pos);
						this.pos += 2;
					}
				} else if (this.expression.charAt(this.pos + 1) === '=') {
					this.current = this.newToken(TokenType.OPERATOR, '|=', this.pos);
					this.pos += 2;
				} else if (this.expression.charAt(this.pos + 1) === '>') {
					this.current = this.newToken(TokenType.OPERATOR, '|>', this.pos);
					this.pos += 2;
				} else {
					this.current = this.newToken(TokenType.OPERATOR, '|', this.pos);
					this.pos++;
				}
				return true;
			case '&':
				if (this.expression.charAt(this.pos + 1) === '&') {
					if (this.expression.charAt(this.pos + 2) === '=') {
						this.current = this.newToken(TokenType.OPERATOR, '&&=', this.pos);
						this.pos += 3;
					} else {
						this.current = this.newToken(TokenType.OPERATOR, '&&', this.pos);
						this.pos += 2;
					}
				} else if (this.expression.charAt(this.pos + 1) === '=') {
					this.current = this.newToken(TokenType.OPERATOR, '&=', this.pos);
					this.pos += 2;
				} else {
					this.current = this.newToken(TokenType.OPERATOR, '&', this.pos);
					this.pos++;
				}
				return true;
			case '?':
				if (this.expression.charAt(this.pos + 1) === '?') {
					if (this.expression.charAt(this.pos + 1) === '=') {
						this.current = this.newToken(TokenType.OPERATOR, '??=', this.pos);
						this.pos += 3;
					} else {
						this.current = this.newToken(TokenType.OPERATOR, '??', this.pos);
						this.pos += 2;
					}
				} else if (this.expression.charAt(this.pos + 1) === '.') {
					this.current = this.newToken(TokenType.OPERATOR, '?.', this.pos);
					this.pos += 2;
				} else {
					this.current = this.newToken(TokenType.OPERATOR, '?', this.pos);
					this.pos++;
				}
				return true;
			case '!':
				if (this.expression.charAt(this.pos + 1) === '=') {
					if (this.expression.charAt(this.pos + 2) === '=') {
						this.current = this.newToken(TokenType.OPERATOR, '!==', this.pos);
						this.pos += 3;
					} else {
						this.current = this.newToken(TokenType.OPERATOR, '!=', this.pos);
						this.pos += 2;
					}
				} else {
					this.current = this.newToken(TokenType.OPERATOR, '!', this.pos);
					this.pos++;
				}
				return true;
			case '.':
				if (/\.\.\./.test(this.expression.substring(this.pos, this.pos + 3))) {
					this.current = this.newToken(TokenType.OPERATOR, '...', this.pos);
					this.pos += 3;
					return true;
				}
			// no break
			case ':':
			case '~':
				this.current = this.newToken(TokenType.OPERATOR, char, this.pos);
				this.pos++;
				return true;
			case 'i':			// in, instanceof
				if (this.expression.charAt(this.pos + 1) === 'n') {
					if (/instanceof\s/.test(this.expression.substring(this.pos, this.pos + 11))) {
						this.current = this.newToken(TokenType.OPERATOR, 'instanceof', this.pos);
						this.pos += 11;
						return true;
					} else if (/\s/.test(this.expression.charAt(this.pos + 2))) {
						this.current = this.newToken(TokenType.OPERATOR, 'in', this.pos);
						this.pos += 3;
						return true;
					}
				}
				return false;
			case 'o':			// typeof
				if (/of\s/.test(this.expression.substring(this.pos, this.pos + 3))) {
					this.current = this.newToken(TokenType.OPERATOR, 'of', this.pos);
					this.pos += 3;
					return true;
				}
				return false;
			case 't':			// typeof
				if (/typeof\s/.test(this.expression.substring(this.pos, this.pos + 7))) {
					this.current = this.newToken(TokenType.OPERATOR, 'typeof', this.pos);
					this.pos += 7;
					return true;
				}
				return false;
			case 'v':			// void
				if (/void\s/.test(this.expression.substring(this.pos, this.pos + 5))) {
					this.current = this.newToken(TokenType.OPERATOR, 'void', this.pos);
					this.pos += 5;
					return true;
				}
				return false;
			case 'd':			// delete
				if (/delete\s/.test(this.expression.substring(this.pos, this.pos + 7))) {
					this.current = this.newToken(TokenType.OPERATOR, 'delete', this.pos);
					this.pos += 7;
					return true;
				}
				return false;
			case 'n':			// new
				if (/new\s/.test(this.expression.substring(this.pos, this.pos + 4))) {
					this.current = this.newToken(TokenType.OPERATOR, 'new', this.pos);
					this.pos += 4;
					return true;
				}
				return false;
			case 'a':			// await, async
				const nextStr = this.expression.substring(this.pos, this.pos + 5);
				if (/(await|async)\s/.test(nextStr)) {
					this.current = this.newToken(TokenType.OPERATOR, nextStr, this.pos);
					this.pos += 5;
					return true;
				}
				return false;
			case 'b':
				if (/break\s?;?/.test(this.expression.substring(this.pos, this.pos + 7))) {
					this.current = this.newToken(TokenType.OPERATOR, 'break', this.pos);
					this.pos += 5;
					return true;
				}
				return false;
			default:
				return false;
		}
	}
	private isStatement() {
		const char = this.expression.charAt(this.pos);
		switch (char) {
			case 'a':
				if (/as\s/.test(this.expression.substring(this.pos, this.pos + 3))) {
					this.current = this.newToken(TokenType.STATEMENT, 'as', this.pos);
					this.pos += 3;
					return true;
				}
				return false;
			case 'c':
				if (/case\s/.test(this.expression.substring(this.pos, this.pos + 5))) {
					this.current = this.newToken(TokenType.STATEMENT, 'case', this.pos);
					this.pos += 5;
					return true;
				} else if (/const\s/.test(this.expression.substring(this.pos, this.pos + 6))) {
					this.current = this.newToken(TokenType.STATEMENT, 'const', this.pos);
					this.pos += 6;
					return true;
				} else if (/continue[\s;]/.test(this.expression.substring(this.pos, this.pos + 9))) {
					this.current = this.newToken(TokenType.STATEMENT, 'continue', this.pos);
					this.pos += 8;
					return true;
				}
				return false;
			case 'd':
				if (/^(do\s?\{)/.test(this.expression.substring(this.pos, this.pos + 4))) {
					this.current = this.newToken(TokenType.STATEMENT, 'do', this.pos);
					this.pos += 2;
					return true;
				} else if (/^(default\s?:)/.test(this.expression.substring(this.pos, this.pos + 9))) {
					this.current = this.newToken(TokenType.STATEMENT, 'default', this.pos);
					this.pos += 7;
					return true;
				}
				return false;
			case 'e':
				if (/else[\s\{]?/.test(this.expression.substring(this.pos, this.pos + 5))) {
					this.current = this.newToken(TokenType.STATEMENT, 'else', this.pos);
					this.pos += 4;
					return true;
				}
				return false;
			case 'f':
				if (/for\s?\(/.test(this.expression.substring(this.pos, this.pos + 5))) {
					this.current = this.newToken(TokenType.STATEMENT, 'for', this.pos);
					this.pos += 3;
					return true;
				}
				return false;
			case 'i':
				if (/if[\s\(]?/.test(this.expression.substring(this.pos, this.pos + 3))) {
					this.current = this.newToken(TokenType.STATEMENT, 'if', this.pos);
					this.pos += 2;
					return true;
				} else if (/in\s/.test(this.expression.substring(this.pos, this.pos + 3))) {
					this.current = this.newToken(TokenType.STATEMENT, 'in', this.pos);
					this.pos += 3;
					return true;
				}
				return false;
			case 'l':
				if (/let\s/.test(this.expression.substring(this.pos, this.pos + 4))) {
					this.current = this.newToken(TokenType.STATEMENT, 'let', this.pos);
					this.pos += 4;
					return true;
				}
				return false;
			case 'of':
				if (/of\s/.test(this.expression.substring(this.pos, this.pos + 3))) {
					this.current = this.newToken(TokenType.STATEMENT, 'of', this.pos);
					this.pos += 3;
					return true;
				}
				return false;
			case 's':
				if (/switch[\s\(]?/.test(this.expression.substring(this.pos, this.pos + 7))) {
					this.current = this.newToken(TokenType.STATEMENT, 'switch', this.pos);
					this.pos += 6;
					return true;
				}
				return false;
			case 'w':
				if (/while[\s\(]?/.test(this.expression.substring(this.pos, this.pos + 6))) {
					this.current = this.newToken(TokenType.STATEMENT, 'while', this.pos);
					this.pos += 5;
					return true;
				}
				return false;
			default:
				return false;
		}
	}

	private getCoordinates() {
		let line = 0;
		let column;
		let newline = -1;
		do {
			line++;
			column = this.pos - newline;
			newline = this.expression.indexOf('\n', newline + 1);
		} while (newline >= 0 && newline < this.pos);

		return {
			line: line,
			column: column
		}
	}

	private parseError(message: String): Error {
		let coords = this.getCoordinates();
		return new Error('parse error [' + coords.line + ':' + coords.column + ']: ' + message);
	}

}

