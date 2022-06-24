import { ExpressionNode } from '../api/expression.js';
import { Token, TokenExpression } from './token.js';
import {
	GlobalThisNode, OfNode, Identifier,
	SymbolNode, AsNode, Literal,
	ThisNode, NullNode, UndefinedNode,
	TrueNode, FalseNode, DefaultNode,
	YieldIdentifier, ConstructorIdentifier,
	ArgumentsIdentifier, NameIdentifier,
	EvalIdentifier, SuperIdentifier, LetIdentifier
} from '../api/definition/values.js';
import { BreakStatement, ContinueStatement } from '../api/statement/control/terminate.js';
import { PrivateIdentifier } from '../api/class/class.js';
import { DebuggerStatement } from '../api/computing/debugger.js';

const FORBIDDEN_CODE_POINT = ['200b', '200c', '200d', 'feff'];

export const IdentifierRegex = /^[_A-Za-z\u00A1-\uFFFF][_A-Za-z0-9\u00A1-\uFFFF]*/;

export const IdentifierStartRegex = /[_$a-zA-Z\xA0-\uFFFF]/;

export const IdentifierPartRegex = /[_$a-zA-Z0-9\xA0-\uFFFF]/;

const EOFToken = Object.freeze(new TokenExpression(Token.EOS)) as TokenExpression;

export interface PreTemplateLiteral extends ExpressionNode { };
export class PreTemplateLiteral {
	constructor(public strings: string[], public expressions: string[]) { }
}

export abstract class TokenStream {
	public static getTokenStream(source: string | TokenExpression[]): TokenStream {
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
	protected current: TokenExpression;
	protected savedCurrent: TokenExpression;
	protected last?: TokenExpression;
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
	lastToken(): TokenExpression | undefined {
		return this.last;
	}
	currentToken() {
		return this.current;
	}
	seekTo(expect: Token): boolean {
		let token: TokenExpression;
		while (true) {
			token = this.next();
			if (token.token === expect) {
				return true;
			}
			else if (token.token === Token.EOS) {
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
	getStreamer(expect: Token = Token.EOS): TokenStream {
		const tokens: TokenExpression[] = [];
		this.readTill(expect, tokens);
		return new TokenStreamer(tokens);
	}
	readTill(expect: Token = Token.EOS, tokens: TokenExpression[]): void {
		if (Token.isClosePair(expect)) {
			this.readTokensPair(Token.openOf(expect), expect, tokens);
		} else {
			this.readTokens(expect, tokens);
		}
	}
	readTokens(expect: Token, tokens: TokenExpression[]): void {
		let token: TokenExpression;
		while (true) {
			token = this.next();
			if (token.token === expect || token.token === Token.EOS) {
				break;
			}
			tokens.push(token);
		}
	}
	readTokensConsiderPair(tokens: TokenExpression[], ...expect: Token[]): void {
		let token: TokenExpression, open: Token;
		while (true) {
			if (Token.isOpenPair(open = this.peek().token)) {
				this.readTokensPair(open, Token.closeOf(open), tokens);
				continue;
			}
			token = this.next();
			if (expect.includes(token.token) || token.token === Token.EOS) {
				break;
			}
			tokens.push(token);
		}
	}
	readTokensPair(open: Token, close: Token, tokens: TokenExpression[]): void {
		// check pair
		let count = 0;
		let token: TokenExpression;
		while (true) {
			token = this.next();
			if (token.token === open) {
				count++;
			}
			else if (token.token === close) {
				if (count > 0) {
					count--;
				}
				if (count === 0) {
					tokens.push(token);
					break;
				}
			}
			else if (token.token === Token.EOS) {
				break;
			}
			tokens.push(token);
		}
	}
	public toTokens(): TokenExpression[] {
		const tokens: TokenExpression[] = [];
		let token: TokenExpression;
		while (true) {
			token = this.next();
			if (token.token === Token.EOS) {
				break;
			}
			tokens.push(token);
		}
		return tokens;
	}
	[Symbol.iterator](): IterableIterator<TokenExpression> {
		this.pos = 0;
		const self = this;
		return {
			[Symbol.iterator]: function () {
				return this;
			},
			next: () => {
				const value = self.next();
				const done = value.isType(Token.EOS);
				return { value, done };
			}
		}
	}
	scanRegExpPattern(): boolean {
		return false;
	};
	peek() {
		this.save();
		const exp = this.next();
		this.restore();
		return exp;
	}
	peekAhead() {
		this.save();
		this.next();
		const exp = this.next();
		this.restore();
		return exp;
	}
	peekPosition() {
		this.save();
		this.next();
		const pos = this.pos;
		this.restore();
		return pos;
	}
	peekAheadPosition() {
		this.save();
		this.next();
		this.next();
		const pos = this.pos;
		this.restore();
		return pos;
	}

	abstract next(): TokenExpression;
	abstract hasLineTerminatorBeforeNext(): boolean;
	abstract hasLineTerminatorAfterNext(): boolean;
	abstract createError(message: String): string;
}

export class TokenStreamer extends TokenStream {
	constructor(private tokens: TokenExpression[]) {
		super();
	}
	next(): TokenExpression {
		if (this.pos === this.tokens.length) {
			return EOFToken;
		}
		this.last = this.current;
		return this.current = this.tokens[this.pos++];
	}
	createError(message: String): string {
		return 'parse error [' + this.pos + ']: ' + message;
	}
	hasLineTerminatorBeforeNext(): boolean {
		return false;
	}
	hasLineTerminatorAfterNext(): boolean {
		return false;
	}
}

export class TokenStreamImpl extends TokenStream {
	static REGEXP_FLAGS = ['g', 'i', 'm', 's', 'u', 'y'];
	static UnicodePattern = /^[0-9a-f]{4}$/i;
	static DecimalPattern = /^[0-9a-f]{2}$/i;
	static AsciiPattern = /^[0-7]{3}$/i;
	static OctalPattern = /^[0-7]+$/i;

	constructor(private expression: string) {
		super();
	}
	private newToken(type: Token, value?: ExpressionNode): TokenExpression {
		return new TokenExpression(type, value);
	}
	next(): TokenExpression {
		if (this.pos >= this.expression.length) {
			return this.current = EOFToken;
		}
		this.last = this.current;
		if (this.isWhitespace() || this.isComment()) {
			return this.next();
		} else if (
			this.isRadixInteger()
			|| this.isNumber()
			// || this.isRegExp()
			|| this.isString()
			|| this.isTemplateLiteral()
			|| this.isCurlY()
			|| this.isParentheses()
			|| this.isBracket()
			|| this.isComma()
			|| this.isSemicolon()
			|| this.isOperator()
			|| this.isStatement()
			|| this.isProperty()) {
			return this.current;
		} else if (this.pos >= this.expression.length) {
			return this.current = EOFToken;
		} else {
			throw new Error(this.createError('Unknown character "' + this.expression.charAt(this.pos) + '"'));
		}
	}
	hasLineTerminatorBeforeNext(): boolean {
		const limit = this.peekPosition();
		const str = this.expression.substring(this.pos, limit);
		return /(?:\r?\n)/g.test(str);
	}
	hasLineTerminatorAfterNext(): boolean {
		const start = this.peekPosition();
		const end = this.peekAheadPosition();
		const str = this.expression.substring(start, end);
		return /(?:\r?\n)/g.test(str);
	}
	private isString() {
		const quote = this.expression.charAt(this.pos);
		if (quote === '\'' || quote === '"') {
			const startPos = this.pos;
			let index = this.expression.indexOf(quote, startPos + 1);
			while (index >= 0 && this.pos < this.expression.length) {
				this.pos = index + 1;
				if (this.expression.charAt(index - 1) !== '\\') {
					const rawString = this.expression.substring(startPos + 1, index);
					const stringNode = new Literal<string>(this.unescape(rawString), `${quote}${rawString}${quote}`);
					this.current = this.newToken(Token.STRING, stringNode);
					return true;
				}
				index = this.expression.indexOf(quote, index + 1);
			}
		}
		return false;
	}
	private isTemplateLiteral(): boolean {
		const quote = this.expression.charAt(this.pos);
		if (quote === '`') {
			const strings: string[] = [], exprs: string[] = [];
			let start = this.pos + 1;
			let i = start;
			for (; i < this.expression.length; i++) {
				if (this.expression[i] === '$' && this.expression[i + 1] === '{') {
					strings.push(this.expression.substring(start, i));
					i += 2;
					start = i;
					let openCount = 0;
					for (; i < this.expression.length; i++) {
						if (this.expression[i] === '$' && this.expression[i + 1] === '{') {
							// if (openCount === 0) {
							// 	start = i;
							// }
							openCount++;
							i++;
						} else if (openCount === 0 && this.expression[i] === '}') {
							exprs.push(this.expression.substring(start, i));
							break;
						} else if (this.expression[i] === '}') {
							openCount--;
						}
					}
					start = i + 1;
				}
				else if (this.expression[i] === '`') {
					break;
				}
			}
			strings.push(this.expression.substring(start, i));
			this.current = this.newToken(Token.TEMPLATE_LITERALS, new PreTemplateLiteral(strings, exprs));
			this.pos = i + 1;
			return true;
		}
		return false;
	}
	private isParentheses() {
		const char = this.expression.charAt(this.pos);
		if (char === '(') {
			this.current = this.newToken(Token.LPAREN);
			this.pos++;
			return true;
		} else if (char === ')') {
			this.current = this.newToken(Token.RPAREN);
			this.pos++;
			return true;
		}
		return false;
	}
	private isBracket() {
		const char = this.expression.charAt(this.pos);
		if (char === '[') {
			this.current = this.newToken(Token.LBRACK);
			this.pos++;
			return true;
		} else if (char === ']') {
			this.current = this.newToken(Token.RBRACK);
			this.pos++;
			return true;
		}
		return false;
	}
	private isCurlY() {
		const char = this.expression.charAt(this.pos);
		if (char === '{') {
			this.current = this.newToken(Token.LBRACE);
			this.pos++;
			return true;
		} else if (char === '}') {
			this.current = this.newToken(Token.RBRACE);
			this.pos++;
			return true;
		}
		return false;
	}
	private isComma() {
		const char = this.expression.charAt(this.pos);
		if (char === ',') {
			this.current = this.newToken(Token.COMMA);
			this.pos++;
			return true;
		}
		return false;
	}

	private isSemicolon() {
		const char = this.expression.charAt(this.pos);
		if (char === ';') {
			this.current = this.newToken(Token.SEMICOLON);
			this.pos++;
			return true;
		}
		return false;
	}
	private isProperty() {
		let startPos = this.pos;
		let i = startPos;
		let isPrivate = false;
		let escape = false;
		let escapeFlag = false;
		// check is private property 
		let char = this.expression.charAt(i);
		if (char === '#') {
			isPrivate = true;
			startPos++;
			i++;
		}
		char = this.expression.charAt(i);
		if (!IdentifierStartRegex.test(char)) {
			if (char === '\\' && this.expression.charAt(i + 1) === 'u') {
				i += 2;
				escapeFlag = escape = true;
				// need to valid the unicode char
			} else {
				return false;
			}
		} else {
			i++;
		}

		for (; i < this.expression.length; i++) {
			char = this.expression.charAt(i);
			if (!IdentifierPartRegex.test(char)) {
				if (char === '\\' && this.expression.charAt(i + 1) === 'u') {
					i++;
					escapeFlag = escape = true;
					continue;
				}
				if ('{' === char && escapeFlag) {
					const end = this.expression.indexOf('}', i + 1);
					if (end === -1) {
						return false;
					}
					escapeFlag = false;
					i = end;
					continue;
				}
				break;
			}
		}
		let identifierName = this.expression.substring(startPos, i);
		if (escape) {
			identifierName = this.unescape(identifierName);
			if (!IdentifierRegex.test(identifierName)) {
				return false;
			}
			this.pos = i;
		} else {
			this.pos += identifierName.length + (isPrivate ? 1 : 0);
		}
		let node: ExpressionNode;
		if (isPrivate) {
			node = new PrivateIdentifier(identifierName);
			this.current = this.newToken(Token.PRIVATE_NAME, node);
		} else {
			switch (identifierName) {
				case 'this': this.current = this.newToken(Token.THIS, ThisNode); break;
				case 'null': this.current = this.newToken(Token.NULL_LITERAL, NullNode); break;
				case 'undefined': this.current = this.newToken(Token.UNDEFINED_LITERAL, UndefinedNode); break;
				case 'true': this.current = this.newToken(Token.TRUE_LITERAL, TrueNode); break;
				case 'false': this.current = this.newToken(Token.FALSE_LITERAL, FalseNode); break;

				case 'globalThis': this.current = this.newToken(Token.IDENTIFIER, GlobalThisNode); break;
				case 'Symbol': this.current = this.newToken(Token.IDENTIFIER, SymbolNode); break;
				case 'of': this.current = this.newToken(Token.IDENTIFIER, OfNode); break;
				case 'as': this.current = this.newToken(Token.IDENTIFIER, AsNode); break;
				case 'default': this.current = this.newToken(Token.DEFAULT, DefaultNode); break;
				case 'yield': this.current = this.newToken(Token.YIELD, YieldIdentifier); break;
				case 'constructor': this.current = this.newToken(Token.IDENTIFIER, ConstructorIdentifier); break;
				case 'arguments': this.current = this.newToken(Token.IDENTIFIER, ArgumentsIdentifier); break;
				case 'name': this.current = this.newToken(Token.IDENTIFIER, NameIdentifier); break;
				case 'eval': this.current = this.newToken(Token.IDENTIFIER, EvalIdentifier); break;
				case 'debugger': this.current = this.newToken(Token.DEBUGGER, DebuggerStatement.INSTANCE); break;
				case 'class': this.current = this.newToken(Token.CLASS); break;

				default:
					node = new Identifier(identifierName);
					this.current = this.newToken(Token.IDENTIFIER, node);
					break;
			}
		}
		return true;

	}
	private isWhitespace() {
		let result = false;
		while (FORBIDDEN_CODE_POINT.includes(this.expression.charCodeAt(this.pos).toString(16)!)) {
			this.pos++;
		}
		let char = this.expression.charAt(this.pos);
		while (/\s/.test(char)) {
			result = true;
			this.pos++;
			if (this.pos >= this.expression.length) {
				break;
			}
			char = this.expression.charAt(this.pos);
		}
		return result;
	}
	private isComment() {
		const char = this.expression.charAt(this.pos);
		const nextChar = this.expression.charAt(this.pos + 1);
		let closeTag: string;
		switch (true) {
			case (char === '/' && nextChar === '/'):
				closeTag = '\n';
				break;
			case (char === '/' && nextChar === '*'):
				closeTag = '*/';
				break;
			case (char === '<' && nextChar === '!'):
				if ('<!--' === this.expression.substring(this.pos, this.pos + 4)) {
					closeTag = '-->';
					break;
				}
			default:
				return false;
		}
		const endPos = this.expression.indexOf(closeTag, this.pos);
		this.pos = endPos == -1 ? this.expression.length : endPos + closeTag.length;
		return true;
	}
	public scanRegExpPattern() {
		const peek = this.peek()
		if (peek.isType(Token.DIV) || peek.isType(Token.DIV_ASSIGN)) {
			this.next();
			let pattern = peek.isType(Token.DIV_ASSIGN) ? '=' : '';

			let start = this.pos;
			let currentPos = this.pos;
			currentPos = this.expression.indexOf('/', currentPos + 1);
			while (currentPos !== -1 && this.expression.charAt(currentPos - 1) === '\\') {
				pattern += this.expression.substring(start, currentPos - 1);
				start = currentPos;
				currentPos = this.expression.indexOf('/', currentPos + 1);
			}
			if (currentPos === -1) {
				return false;
			}
			pattern += this.expression.substring(start, currentPos);
			currentPos++;
			let flags = '';
			const remainFlags = TokenStreamImpl.REGEXP_FLAGS.slice();
			while (true) {
				const code = this.expression.charCodeAt(currentPos);
				const nextChar = this.expression.charAt(currentPos);
				if (/[\.\s]/.test(nextChar) || Number.isNaN(code) /* || FORBIDDEN_CODE_POINT.includes(code.toString(16))*/) {
					break;
				}
				const nextCharIndex = remainFlags.indexOf(nextChar);
				if (nextCharIndex === -1) {
					if (flags.includes(nextChar)) {
						throw new Error(this.createError('Invalid regular expression flags'));
					}
					break;
				} else {
					flags += nextChar;
					remainFlags.splice(nextCharIndex, 1);
					currentPos++;
				}
			}
			const regexNode = new Literal<RegExp>(new RegExp(pattern, flags), `/${pattern}/${flags}`, { pattern, flags });
			this.current = this.newToken(Token.REGEXP_LITERAL, regexNode);
			this.pos = currentPos;
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
					index++;
					buffer += c;
					break;
				case '\b':
				case '\f':
				case '\n':
				case '\r':
				case '\t':
				case '\v':
					index++;
					buffer += '\\' + c;
					break;
				case 'b':
					index++;
					buffer += '\b';
					break;
				case 'f':
					index++;
					buffer += '\f';
					break;
				case 'n':
					index++;
					buffer += '\n';
					break;
				case 'r':
					index++;
					buffer += '\r';
					break;
				case 't':
					index++;
					buffer += '\t';
					break;
				case 'v':
					index++;
					buffer += '\v';
					break;
				case 'u': {
					index++;
					// interpret the following 4 characters as the hex of the unicode code point
					if ('{' === v.charAt(index)) {
						index++;
						const start = index;
						const end = v.indexOf('}', start + 1);
						const codePoint = v.substring(start, end);
						buffer += String.fromCodePoint(parseInt(codePoint, 16));
						index = end + 1;
					} else {
						const codePoint = v.substring(index, index + 4);
						if (!TokenStreamImpl.UnicodePattern.test(codePoint)) {
							throw new Error(this.createError('Illegal escape sequence: \\u ' + codePoint));
						}
						buffer += String.fromCodePoint(parseInt(codePoint, 16));
						index += 4;
					}
					break;
				}
				case 'x': {
					index++;
					// interpret the following 2 characters as the hex of the decimal code point
					let codePoint = v.substring(index, index + 2);
					if (!TokenStreamImpl.DecimalPattern.test(codePoint)) {
						throw new Error(this.createError('Illegal escape sequence: \\x ' + codePoint));
					}
					buffer += String.fromCharCode(parseInt(codePoint, 16));
					index += 2;
					break;
				}
				default:
					if (!Number.isNaN(parseInt(c, 8))) {
						let codePoint = v.substring(index, index + 3);
						if (!TokenStreamImpl.AsciiPattern.test(codePoint)) {
							throw new Error(this.createError('Illegal escape sequence: ASCII 8 base, ' + codePoint));
						}
						buffer += String.fromCharCode(parseInt(codePoint, 8));
						index += 3;
						break;
					}
					throw new Error(this.createError('Illegal escape sequence: "\\' + c + '"'));
			}
			let backslash = v.indexOf('\\', index);
			if (backslash == -1) {
				buffer += v.substring(index, v.length);
				break;
			} else {
				buffer += v.substring(index, backslash);
				index = backslash;
			}
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
			const string = this.expression.substring(startPos, pos);
			const rawString = this.expression.substring(this.pos, pos);
			const numNode = new Literal<number>(parseInt(string, radix), rawString);
			this.current = this.newToken(Token.NUMBER, numNode);
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
		let isOctal = false;
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
			} else if ('o' == c.toLowerCase()) {
				if (pos == startPos + 1) {
					pos++;
					isOctal = true;
				} else {
					break;
				}
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
			const rawString = this.expression.substring(startPos, pos);
			if (this.expression.charAt(pos) === 'n') {
				const bigintNode = new Literal<BigInt>(BigInt(rawString), rawString + 'n', undefined, rawString);
				this.current = this.newToken(Token.BIGINT, bigintNode);
				pos++;
			} else {
				let numNode: Literal<number>;
				if (isOctal) {
					const octal = rawString.substring(2);
					if (TokenStreamImpl.OctalPattern.test(octal)) {
						numNode = new Literal<number>(parseInt(octal, 8), rawString);
					} else {
						return false;
					}
				} else {
					numNode = new Literal<number>(parseFloat(rawString), rawString);
				}
				this.current = this.newToken(Token.NUMBER, numNode);
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
					this.current = this.newToken(Token.INC);
					this.pos += 2;
				} else if (this.expression.charAt(this.pos + 1) === '=') {
					this.current = this.newToken(Token.ADD_ASSIGN);
					this.pos += 2;
				} else {
					this.current = this.newToken(Token.ADD);
					this.pos++;
				}
				return true;
			case '-':
				if (this.expression.charAt(this.pos + 1) === '-') {
					this.current = this.newToken(Token.DEC);
					this.pos += 2;
				} else if (this.expression.charAt(this.pos + 1) === '=') {
					this.current = this.newToken(Token.SUB_ASSIGN);
					this.pos += 2;
				} else {
					this.current = this.newToken(Token.SUB);
					this.pos++;
				}
				return true;
			case '=':
				if (this.expression.charAt(this.pos + 1) === '=') {
					if (this.expression.charAt(this.pos + 2) === '=') {
						this.current = this.newToken(Token.EQ_STRICT);
						this.pos += 3;
					} else {
						this.current = this.newToken(Token.EQ);
						this.pos += 2;
					}
				} else if (this.expression.charAt(this.pos + 1) === '>') {
					this.current = this.newToken(Token.ARROW);
					this.pos += 2;
				} else {
					this.current = this.newToken(Token.ASSIGN);
					this.pos++;
				}
				return true;
			case '*':
				if (this.expression.charAt(this.pos + 1) === '*') {
					if (this.expression.charAt(this.pos + 2) === '=') {
						this.current = this.newToken(Token.EXP_ASSIGN);
						this.pos += 3;
					} else {
						this.current = this.newToken(Token.EXP);
						this.pos += 2;
					}
				} else if (this.expression.charAt(this.pos + 1) === '=') {
					this.current = this.newToken(Token.MUL_ASSIGN);
					this.pos += 2;
				} else {
					this.current = this.newToken(Token.MUL);
					this.pos++;
				}
				return true;
			case '/':
				if (this.expression.charAt(this.pos + 1) === '=') {
					this.current = this.newToken(Token.DIV_ASSIGN);
					this.pos += 2;
				} else {
					this.current = this.newToken(Token.DIV);
					this.pos++;
				}
				return true;
			case '%':
				if (this.expression.charAt(this.pos + 1) === '%') {
					if (this.expression.charAt(this.pos + 1) === '=') {
						this.current = this.newToken(Token.MODULO_ASSIGN);
						this.pos += 3;
					} else {
						this.current = this.newToken(Token.MODULO);
						this.pos += 2;
					}
				} else if (this.expression.charAt(this.pos + 1) === '=') {
					this.current = this.newToken(Token.MOD_ASSIGN);
					this.pos += 2;
				} else {
					this.current = this.newToken(Token.MOD);
					this.pos++;
				}
				return true;
			case '^':
				if (this.expression.charAt(this.pos + 1) === '=') {
					this.current = this.newToken(Token.BIT_XOR_ASSIGN);
					this.pos += 2;
				} else {
					this.current = this.newToken(Token.BIT_XOR);
					this.pos++;
				}
				return true;
			case '>':
				if (this.expression.charAt(this.pos + 1) === '>') {
					if (this.expression.charAt(this.pos + 2) === '>') {
						if (this.expression.charAt(this.pos + 3) === '=') {
							this.current = this.newToken(Token.SHR_ASSIGN);
							this.pos += 4;
						} else {
							this.current = this.newToken(Token.SHR);
							this.pos += 3;
						}
					} else if (this.expression.charAt(this.pos + 2) === '=') {
						this.current = this.newToken(Token.SAR_ASSIGN);
						this.pos += 3;
					} else {
						this.current = this.newToken(Token.SAR);
						this.pos += 2;
					}
				} else if (this.expression.charAt(this.pos + 1) === '=') {
					this.current = this.newToken(Token.GTE);
					this.pos += 2;
				} else if (this.expression.charAt(this.pos + 1) === '?') {
					if (this.expression.charAt(this.pos + 2) === '=') {
						this.current = this.newToken(Token.LARGER_ASSIGN);
						this.pos += 3;
					} else {
						this.current = this.newToken(Token.LARGER);
						this.pos += 2;
					}
				} else {
					this.current = this.newToken(Token.GT);
					this.pos++;
				}
				return true;
			case '<':
				if (this.expression.charAt(this.pos + 1) === '<') {
					if (this.expression.charAt(this.pos + 2) === '=') {
						this.current = this.newToken(Token.SHL_ASSIGN);
						this.pos += 3;
					} else {
						this.current = this.newToken(Token.SHL);
						this.pos += 2;
					}
				} else if (this.expression.charAt(this.pos + 1) === '=') {
					if (this.expression.charAt(this.pos + 2) === '>') {
						this.current = this.newToken(Token.SPACESHIP);
						this.pos += 3;
					} else {
						this.current = this.newToken(Token.LTE);
						this.pos += 2;
					}
				} else if (this.expression.charAt(this.pos + 1) === '?') {
					if (this.expression.charAt(this.pos + 2) === '=') {
						this.current = this.newToken(Token.SMALLER_ASSIGN);
						this.pos += 3;
					} else {
						this.current = this.newToken(Token.SMALLER);
						this.pos += 2;
					}
				} else {
					this.current = this.newToken(Token.LT);
					this.pos++;
				}
				return true;
			case '|':
				if (this.expression.charAt(this.pos + 1) === '|') {
					if (this.expression.charAt(this.pos + 2) === '=') {
						this.current = this.newToken(Token.OR_ASSIGN);
						this.pos += 3;
					} else {
						this.current = this.newToken(Token.OR);
						this.pos += 2;
					}
				} else if (this.expression.charAt(this.pos + 1) === '=') {
					this.current = this.newToken(Token.BIT_OR_ASSIGN);
					this.pos += 2;
				} else if (this.expression.charAt(this.pos + 1) === '>') {
					this.current = this.newToken(Token.PIPELINE);
					this.pos += 2;
				} else {
					this.current = this.newToken(Token.BIT_OR);
					this.pos++;
				}
				return true;
			case '&':
				if (this.expression.charAt(this.pos + 1) === '&') {
					if (this.expression.charAt(this.pos + 2) === '=') {
						this.current = this.newToken(Token.AND_ASSIGN);
						this.pos += 3;
					} else {
						this.current = this.newToken(Token.AND);
						this.pos += 2;
					}
				} else if (this.expression.charAt(this.pos + 1) === '=') {
					this.current = this.newToken(Token.BIT_AND_ASSIGN);
					this.pos += 2;
				} else {
					this.current = this.newToken(Token.BIT_AND);
					this.pos++;
				}
				return true;
			case '?':
				if (this.expression.charAt(this.pos + 1) === '?') {
					if (this.expression.charAt(this.pos + 2) === '=') {
						this.current = this.newToken(Token.NULLISH_ASSIGN);
						this.pos += 3;
					} else {
						this.current = this.newToken(Token.NULLISH);
						this.pos += 2;
					}
				} else if (this.expression.substring(this.pos + 1, this.pos + 3) == '::') {
					this.current = this.newToken(Token.QUESTION_BIND);
					this.pos += 3;
				} else if (this.expression.charAt(this.pos + 1) === '.') {
					this.current = this.newToken(Token.QUESTION_PERIOD);
					this.pos += 2;
				} else {
					this.current = this.newToken(Token.CONDITIONAL);
					this.pos++;
				}
				return true;
			case '!':
				if (this.expression.charAt(this.pos + 1) === '=') {
					if (this.expression.charAt(this.pos + 2) === '=') {
						this.current = this.newToken(Token.NE_STRICT);
						this.pos += 3;
					} else {
						this.current = this.newToken(Token.NE);
						this.pos += 2;
					}
				} else {
					this.current = this.newToken(Token.NOT);
					this.pos++;
				}
				return true;
			case '.':
				if (/\.\.\./.test(this.expression.substring(this.pos, this.pos + 3))) {
					this.current = this.newToken(Token.ELLIPSIS);
					this.pos += 3;
					return true;
				} else {
					this.current = this.newToken(Token.PERIOD);
					this.pos++;
				}
				return true;
			// no break
			case ':':
				if (this.expression.charAt(this.pos + 1) === ':') {
					this.current = this.newToken(Token.QUESTION_BIND);
					this.pos += 2;
				} else {
					this.current = this.newToken(Token.COLON);
					this.pos++;
				}
				return true;
			case '~':
				this.current = this.newToken(Token.BIT_NOT);
				this.pos++;
				return true;
			case 'a':
				if (/async\s/.test(this.expression.substring(this.pos, this.pos + 6))) {
					this.current = this.newToken(Token.ASYNC);
					this.pos += 5;
					return true;
				}
				if (/await\s/.test(this.expression.substring(this.pos, this.pos + 6))) {
					this.current = this.newToken(Token.AWAIT);
					this.pos += 5;
					return true;
				}
				return false;
			case 'i':			// in, instanceof
				if (this.expression.charAt(this.pos + 1) === 'n') {
					if (/instanceof\s/.test(this.expression.substring(this.pos, this.pos + 11))) {
						this.current = this.newToken(Token.INSTANCEOF);
						this.pos += 11;
						return true;
					} else if (/\s/.test(this.expression.charAt(this.pos + 2))) {
						this.current = this.newToken(Token.IN);
						this.pos += 3;
						return true;
					}
				}
				return false;
			case 't':			// typeof
				if (/typeof\s/.test(this.expression.substring(this.pos, this.pos + 7))) {
					this.current = this.newToken(Token.TYPEOF);
					this.pos += 7;
					return true;
				}
				return false;
			case 'v':			// void
				if (/void\s/.test(this.expression.substring(this.pos, this.pos + 5))) {
					this.current = this.newToken(Token.VOID);
					this.pos += 5;
					return true;
				}
				return false;
			case 'd':			// delete
				if (/delete\s/.test(this.expression.substring(this.pos, this.pos + 7))) {
					this.current = this.newToken(Token.DELETE);
					this.pos += 7;
					return true;
				}
				return false;
			case 'n':			// new
				if (/new\s/.test(this.expression.substring(this.pos, this.pos + 4))) {
					this.current = this.newToken(Token.NEW);
					this.pos += 4;
					return true;
				}
				return false;
			case 'n':			// new
				if (/new\s/.test(this.expression.substring(this.pos, this.pos + 4))) {
					this.current = this.newToken(Token.NEW);
					this.pos += 4;
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
			// case 'a':
			// 	if (/as\s/.test(this.expression.substring(this.pos, this.pos + 3))) {
			// 		this.current = this.newToken(Token.AS);
			// 		this.pos += 3;
			// 		return true;
			// 	}
			// return false;
			case 'b':
				if (/break\s?;?/.test(this.expression.substring(this.pos, this.pos + 7))) {
					this.current = this.newToken(Token.BREAK, BreakStatement.BREAK_INSTANCE);
					this.pos += 5;
					return true;
				}
				return false;
			case 'c':
				if (/case[\s~!+-\/\('"`]/.test(this.expression.substring(this.pos, this.pos + 5))) {
					this.current = this.newToken(Token.CASE);
					this.pos += 4;
					return true;
				} else if (/const\s/.test(this.expression.substring(this.pos, this.pos + 6))) {
					this.current = this.newToken(Token.CONST);
					this.pos += 6;
					return true;
				} else if (/catch[\s\{\(]/.test(this.expression.substring(this.pos, this.pos + 6))) {
					this.current = this.newToken(Token.CATCH);
					this.pos += 5;
					return true;
				} else if (/class\s/.test(this.expression.substring(this.pos, this.pos + 6))) {
					this.current = this.newToken(Token.CLASS);
					this.pos += 6;
					return true;
				} else if (/continue[\s;]/.test(this.expression.substring(this.pos, this.pos + 9))) {
					this.current = this.newToken(Token.CONTINUE, ContinueStatement.CONTINUE_INSTANCE);
					this.pos += 8;
					return true;
				}
				return false;
			case 'd':
				if (/do[\s|\{]/.test(this.expression.substring(this.pos, this.pos + 3))) {
					this.current = this.newToken(Token.DO);
					this.pos += 2;
					return true;
				}
				return false;
			case 'e':
				if (/else[\s|\{]/.test(this.expression.substring(this.pos, this.pos + 5))) {
					this.current = this.newToken(Token.ELSE);
					this.pos += 4;
					return true;
				}
				if (/export\s/.test(this.expression.substring(this.pos, this.pos + 7))) {
					this.current = this.newToken(Token.EXPORT);
					this.pos += 7;
					return true;
				}
				if (/extends\s/.test(this.expression.substring(this.pos, this.pos + 8))) {
					this.current = this.newToken(Token.EXTENDS);
					this.pos += 8;
					return true;
				}
				return false;
			case 'g':
				if (/get\s/.test(this.expression.substring(this.pos, this.pos + 4))) {
					this.current = this.newToken(Token.GET);
					this.pos += 4;
					return true;
				}
				return false;
			case 'f':
				if (/for[\s\(]/.test(this.expression.substring(this.pos, this.pos + 4))) {
					this.current = this.newToken(Token.FOR);
					this.pos += 3;
					return true;
				}
				if (/finally[\s\{]/.test(this.expression.substring(this.pos, this.pos + 8))) {
					this.current = this.newToken(Token.FINALLY);
					this.pos += 7;
					return true;
				}
				if (/function[\s\*\(]/.test(this.expression.substring(this.pos, this.pos + 9))) {
					this.current = this.newToken(Token.FUNCTION);
					this.pos += 8;
					return true;
				}
				return false;
			case 'i':
				if (/if[\s|\(]/.test(this.expression.substring(this.pos, this.pos + 3))) {
					this.current = this.newToken(Token.IF);
					this.pos += 2;
					return true;
				} else if (/in\s/.test(this.expression.substring(this.pos, this.pos + 3))) {
					this.current = this.newToken(Token.IN);
					this.pos += 3;
					return true;
				}
				else if (/import\s/.test(this.expression.substring(this.pos, this.pos + 7))) {
					this.current = this.newToken(Token.IMPORT);
					this.pos += 7;
					return true;
				}
				return false;
			case 'l':
				if (/let\s/.test(this.expression.substring(this.pos, this.pos + 4))) {
					this.current = this.newToken(Token.LET, LetIdentifier);
					this.pos += 4;
					return true;
				}
				return false;
			case 't':
				if (/try[\s\{]/.test(this.expression.substring(this.pos, this.pos + 4))) {
					this.current = this.newToken(Token.TRY);
					this.pos += 3;
					return true;
				}
				if (/throw\s/.test(this.expression.substring(this.pos, this.pos + 6))) {
					this.current = this.newToken(Token.THROW);
					this.pos += 6;
					return true;
				}
				return false;
			case 'r':
				if (/return[\s~!+-\/\('"`]/.test(this.expression.substring(this.pos, this.pos + 7))) {
					this.current = this.newToken(Token.RETURN);
					this.pos += 6;
					return true;
				}
				return false;
			// case 'of':
			// 	if (/of\s/.test(this.expression.substring(this.pos, this.pos + 3))) {
			// 		this.current = this.newToken(Token.OF);
			// 		this.pos += 3;
			// 		return true;
			// 	}
			// 	return false;
			case 's':
				if (/switch(\s|\()/.test(this.expression.substring(this.pos, this.pos + 7))) {
					this.current = this.newToken(Token.SWITCH);
					this.pos += 6;
					return true;
				}
				if (/static\s/.test(this.expression.substring(this.pos, this.pos + 7))) {
					this.current = this.newToken(Token.STATIC);
					this.pos += 7;
					return true;
				}
				if (/set\s/.test(this.expression.substring(this.pos, this.pos + 4))) {
					this.current = this.newToken(Token.SET);
					this.pos += 4;
					return true;
				}
				if (/super[\.\(]?/.test(this.expression.substring(this.pos, this.pos + 6))) {
					this.current = this.newToken(Token.SUPER, SuperIdentifier);
					this.pos += 5;
					return true;
				}
				return false;
			case 'w':
				if (/while(\s|\()/.test(this.expression.substring(this.pos, this.pos + 6))) {
					this.current = this.newToken(Token.WHILE);
					this.pos += 5;
					return true;
				}
				return false;
			case 'v':
				if (/var\s/.test(this.expression.substring(this.pos, this.pos + 4))) {
					this.current = this.newToken(Token.VAR);
					this.pos += 4;
					return true;
				}
				return false;
			default:
				return false;
		}
	}
	protected getCoordinates() {
		let line = 0, column, newline = -1;
		do {
			line++;
			column = this.pos - newline;
			newline = this.expression.indexOf('\n', newline + 1);
		} while (newline >= 0 && newline < this.pos);
		return { line, column };
	}
	public createError(message: String): string {
		let coords = this.getCoordinates();
		const lastLinePos = this.expression.lastIndexOf('\n', this.pos) + 1;
		let nextLinePos = this.expression.indexOf('\n', this.pos + 1);
		if (nextLinePos == -1) {
			nextLinePos = this.expression.length;
		}
		const subStart = Math.max(lastLinePos, this.pos - 25);
		const subEnd = Math.min(nextLinePos, this.pos + 25, this.expression.length);

		const errorAt = this.expression.substring(subStart, subEnd);
		const indictor = new Array<string>(subEnd - subStart).fill(' ');
		indictor[this.pos - subStart] = '^';
		const errorIndictor = indictor.join('');
		return `
			> ${message}
			> token name: '${this.current?.token?.getName()}' ${this.current.value ? `parsed: ${this.current.value.toString()}` : ''}
			> ${coords.line}:${coords.column}\t${errorAt}
			> ${coords.line}:${coords.column}\t${errorIndictor}
			`;
	}
}
