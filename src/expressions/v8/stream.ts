import { ExpressionNode } from '../api/expression.js';
import { Token, TokenExpression } from './token.js';
import { Identifier, Literal } from '../api/definition/values.js';
import { PrivateIdentifier, Super } from '../api/class/class.js';
import { DebuggerStatement } from '../api/computing/debugger.js';
import { isStrict, LanguageMode } from './language.js';

const FORBIDDEN_CODE_POINT = ['200b', '200c', '200d', 'feff'];

export const IdentifierRegex = /^[_A-Za-z\u00A1-\uFFFF][_A-Za-z0-9\u00A1-\uFFFF]*/;

export const IdentifierStartRegex = /[_$a-zA-Z\xA0-\uFFFF]/;

export const IdentifierPartRegex = /[_$a-zA-Z0-9\xA0-\uFFFF]/;

export interface PreTemplateLiteral extends ExpressionNode { };
export class PreTemplateLiteral {
	constructor(public strings: string[], public expressions: string[]) { }
}

export interface TemplateStringLiteral extends ExpressionNode { };
export class TemplateStringLiteral {
	constructor(public string: string, public range: [number, number]) { }
}

export abstract class TokenStream {
	public static getTokenStream(source: string | TokenExpression[], mode?: LanguageMode): TokenStream {
		if (Array.isArray(source)) {
			return new TokenStreamer(source, mode);
		}
		else if (typeof source === 'string') {
			return new TokenStreamImpl(source, mode);
		}
		throw new Error(`Can't build token stream for ${source}`);
	}
	protected pos = 0;
	protected savedPosition = 0;
	protected current: TokenExpression;
	protected savedCurrent: TokenExpression;
	protected last?: TokenExpression;
	constructor(protected mode = LanguageMode.Strict) { }
	setLanguageMode(mode: LanguageMode) {
		this.mode = mode;
	}
	getLanguageMode() {
		return this.mode;
	}
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
	abstract scanTemplateContinuation(): TokenExpression;
}

export class TokenStreamer extends TokenStream {
	constructor(private tokens: TokenExpression[], mode?: LanguageMode) {
		super(mode);
	}
	next(): TokenExpression {
		if (this.pos === this.tokens.length) {
			return new TokenExpression(Token.EOS, [-1, -1]);
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
	scanTemplateContinuation(): TokenExpression {
		return this.next();
	}
}

export class TokenStreamImpl extends TokenStream {
	static REGEXP_FLAGS = ['g', 'i', 'm', 's', 'u', 'y'];
	static UnicodePattern = /^[0-9a-f]{4}$/i;
	static DecimalPattern = /^[0-9a-f]{2}$/i;
	static AsciiPattern = /^[0-7]{1,3}$/i;
	static OctalPattern = /^[0-7]+$/i;

	constructor(private expression: string, mode?: LanguageMode) {
		super(mode);
	}
	private newToken(type: Token, range: [number, number], value?: ExpressionNode): TokenExpression {
		return new TokenExpression(type, range, value);
	}
	next(): TokenExpression {
		if (this.pos >= this.expression.length) {
			return this.current = this.newToken(Token.EOS, [this.expression.length, this.expression.length]);
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
			return this.current = this.newToken(Token.EOS, [this.expression.length, this.expression.length]);
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
			const start = this.pos;
			let literal: string[] = [];
			let c0: string = '';
			const advance = () => {
				c0 = this.expression.charAt(++this.pos);
			};
			const advanceUntil = (check: (char: string) => boolean) => {
				while (true) {
					c0 = this.expression.charAt(++this.pos);
					if (this.pos >= this.expression.length) {
						return;
					}
					const result = check(c0);
					if (result) {
						break;
					}
				}
			};
			const addLiteralChar = (char: string) => literal.push(char);

			while (true) {
				advanceUntil(char => {
					if (char.charCodeAt(0) > 127) {
						if (this.isStringLiteralLineTerminator(char)) {
							return true;
						}
						addLiteralChar(char);
						return false;
					}
					if (this.mayTerminateString(char)) return true;
					addLiteralChar(c0);
					return false;
				});
				while (c0 === '\\') {
					advance();
					const char = this.scanEscape(false);
					if (char == '' || !char) {
						return false;
					}
					addLiteralChar(char);
					advance();
				}
				if (c0 === quote) {
					advance();
					const end = this.pos;
					const string = literal.join('');
					const rawString = this.expression.substring(start, end);
					const range: [number, number] = [start, end];
					const stringNode = new Literal<string>(string, rawString, undefined, undefined, range);
					this.current = this.newToken(Token.STRING, range, stringNode);
					return true;
				}
				if (c0 == '' || this.pos >= this.expression.length) {
					// Unterminated string literal
					break;
				}
				addLiteralChar(c0);
			}
		}
		return false;
	}
	private isTemplateLiteral(): boolean {
		const quote = this.expression.charAt(this.pos);
		if (quote === '`') {
			this.pos++;
			this.current = this.scanTemplateSpan();
			return true;
		}
		return false;
	}
	private scanTemplateSpan(): TokenExpression {
		// When scanning a TemplateSpan, we are looking for the following construct:
		// TEMPLATE_SPAN ::
		//     ` LiteralChars* ${
		//   | } LiteralChars* ${
		//
		// TEMPLATE_TAIL ::
		//     ` LiteralChars* `
		//   | } LiteralChar* `
		//
		// A TEMPLATE_SPAN should always be followed by an Expression, while a
		// TEMPLATE_TAIL terminates a TemplateLiteral and does not need to be
		// followed by an Expression.

		// These scoped helpers save and restore the original error state, so that we
		// can specially treat invalid escape sequences in templates (which are
		// handled by the parser).

		const start = this.pos;
		let result = Token.TEMPLATE_SPAN;
		let literal: string[] = [],
			c0: string = this.expression.charAt(this.pos);
		const advance = () => {
			this.pos++;
			c0 = this.expression.charAt(this.pos);
		};
		const addLiteralChar = (char: string) => literal.push(char);
		while (true) {
			let c = c0;
			if (c == '`') {
				advance();  // Consume '`'
				result = Token.TEMPLATE_TAIL;
				break;
			} else if (c == '$' && this.expression.charAt(this.pos + 1) == '{') {
				advance();	// Consume '$'
				advance();	// Consume '{'
				break;
			} else if (c == '\\') {
				advance();  // Consume '\\'
				if (this.isLineTerminator(c0)) {
					// The TV of LineContinuation :: \ LineTerminatorSequence is the empty
					// code unit sequence.
					let lastChar = c0;
					advance();
					if (lastChar == '\r') {
						// Also skip \n.
						if (c0 == '\n') advance();
						lastChar = '\n';
					}
					addLiteralChar(lastChar);
				} else {
					const char = this.scanEscape(true);
					if (char === false) {
						throw new SyntaxError(this.createError('Unterminated Template Escape char'));
					}
					addLiteralChar(char);
					advance();
				}
			} else if (c == '' || this.pos >= this.expression.length) {
				// Unterminated template literal
				break;
			} else {
				advance();  // Consume c.
				// The TRV of LineTerminatorSequence :: <CR> is the CV 0x000A.
				// The TRV of LineTerminatorSequence :: <CR><LF> is the sequence
				// consisting of the CV 0x000A.
				if (c == '\r') {
					if (c0 == '\n') advance();  // Consume '\n'
					c = '\n';
				}
				addLiteralChar(c);
			}
		}
		const range: [number, number] = [start, this.pos];
		return this.newToken(result, range, new TemplateStringLiteral(literal.join(''), range));
	}
	public scanTemplateContinuation(): TokenExpression {
		if (this.current.isNotType(Token.RBRACE)) {
			throw new SyntaxError(this.createError('Unterminated Template Expr'));
		}
		return this.scanTemplateSpan();
	}
	private scanEscape(scanTemplateSpan: boolean): string | false {
		let c0: string = this.expression.charAt(this.pos);
		let c: string | false = c0;
		// Skip escaped newlines.
		if (!scanTemplateSpan && this.isLineTerminator(c)) {
			// Allow escaped CR+LF newlines in multiline string literals.
			if (c == '\r' && this.expression.charAt(this.pos + 1) == '\n') this.pos++;
			return '\n';
		}

		switch (c) {
			case 'b': c = '\b'; break;
			case 'f': c = '\f'; break;
			case 'n': c = '\n'; break;
			case 'r': c = '\r'; break;
			case 't': c = '\t'; break;
			case 'u': {
				this.pos++;
				c = this.scanUnicodeEscape();
				if (c === false) return false;
				break;
			}
			case 'v':
				c = '\v';
				break;
			case 'x': {
				this.pos++;
				c = this.scanHexNumber(2);
				if (c === false) return false;
				break;
			}
			case '0':
			case '1':
			case '2':
			case '3':
			case '4':
			case '5':
			case '6':
			case '7':
				this.pos++;
				c = this.scanOctalEscape(c, 2);
				break;
			case '8':
			case '9':
				// '\8' and '\9' are disallowed in strict mode.
				// Re-use the octal error state to propagate the error.
				throw new SyntaxError(this.createError(`'\\8' and '\\9' are disallowed in strict mode.`));
		}
		// Other escaped characters are interpreted as their non-escaped version.
		return c;
	}
	private scanUnicodeEscape(): string | false {
		// Accept both \uxxxx and \u{xxxxxx}. In the latter case, the number of
		// hex digits between { } is arbitrary. \ and u have already been read.
		let c0: string = this.expression.charAt(this.pos);
		if (c0 == '{') {
			this.pos++;
			const cp = this.scanUnlimitedLengthHexNumber(0x10ffff);
			c0 = this.expression.charAt(++this.pos);
			if (c0 != '}') {
				return false;
			}
			return cp;
		}
		return this.scanHexNumber(4);
	}
	private scanHexNumber(length: number): string | false {
		if (length > 4) { // prevent overflow
			throw new RangeError(this.createError('ScanHexNumber: length should be less than or equal to 4'));
		}
		let x = 0;
		let scanned = this.pos;
		let c0: string = this.expression.charAt(scanned);
		for (let i = 0; i < length; i++) {
			let d = this.hexValue(c0);
			if (d < 0) {
				return false;
			}
			x = x * 16 + d;
			c0 = this.expression.charAt(++scanned);
		}
		this.pos = scanned - 1;
		return String.fromCodePoint(x);
	}
	private scanUnlimitedLengthHexNumber(max_value: number) {
		let x = 0;
		let scanned = this.pos;
		let c0: string = this.expression.charAt(scanned);
		let d = this.hexValue(c0);
		if (d < 0) {
			throw new RangeError(this.createError('Invalid code'));
		}
		while (d >= 0) {
			x = x * 16 + d;
			if (x > max_value) {
				throw new RangeError(this.createError('Undefined Unicode Code Point'));
			}
			c0 = this.expression.charAt(++scanned);
			d = this.hexValue(c0);
		}
		this.pos = scanned - 1;
		return String.fromCodePoint(x);
	}
	private hexValue(c: string) {
		let x = c.charCodeAt(0) - '0'.charCodeAt(0);
		if (x <= 9) return x;
		x = (x | 0x20) - ('a'.charCodeAt(0) - '0'.charCodeAt(0));  // detect 0x11..0x16 and 0x31..0x36.
		if (x <= 5) return x + 10;
		return -1;
	}
	private scanOctalEscape(c: string, length: number): string | false {
		if (!('0' <= c && c <= '7')) {
			throw new SyntaxError(this.createError('Invalid octal escape sequence'));
		}
		const zero = '0'.charCodeAt(0);
		let x = c.charCodeAt(0) - zero;
		let scanned = 0;
		let i: number = 0;
		let char: string = '';
		for (; i < length; i++) {
			char = this.expression.charAt(this.pos + i);
			let d = char.charCodeAt(0) - zero;
			if (d < 0 || d > 7) break;
			const nx = x * 8 + d;
			if (nx >= 256) break;
			x = nx;
			scanned++;
		}
		this.pos += scanned - 1;
		return String.fromCharCode(x);
	}
	private isParentheses() {
		const char = this.expression.charAt(this.pos);
		if (char === '(') {
			this.current = this.newToken(Token.LPAREN, [this.pos, ++this.pos]);
			return true;
		} else if (char === ')') {
			this.current = this.newToken(Token.RPAREN, [this.pos, ++this.pos]);
			return true;
		}
		return false;
	}
	private isBracket() {
		const char = this.expression.charAt(this.pos);
		if (char === '[') {
			this.current = this.newToken(Token.LBRACK, [this.pos, ++this.pos]);
			return true;
		} else if (char === ']') {
			this.current = this.newToken(Token.RBRACK, [this.pos, ++this.pos]);
			return true;
		}
		return false;
	}
	private isCurlY() {
		const char = this.expression.charAt(this.pos);
		if (char === '{') {
			this.current = this.newToken(Token.LBRACE, [this.pos, ++this.pos]);
			return true;
		} else if (char === '}') {
			this.current = this.newToken(Token.RBRACE, [this.pos, ++this.pos]);
			return true;
		}
		return false;
	}
	private isComma() {
		const char = this.expression.charAt(this.pos);
		if (char === ',') {
			this.current = this.newToken(Token.COMMA, [this.pos, ++this.pos]);
			return true;
		}
		return false;
	}

	private isSemicolon() {
		const char = this.expression.charAt(this.pos);
		if (char === ';') {
			this.current = this.newToken(Token.SEMICOLON, [this.pos, ++this.pos]);
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
			const range: [number, number] = [startPos - 1, this.pos];
			node = new PrivateIdentifier(identifierName, range);
			this.current = this.newToken(Token.PRIVATE_NAME, range, node);
		} else {
			const range: [number, number] = [startPos, this.pos];
			switch (identifierName) {
				case 'this': this.current = this.newToken(Token.THIS, range); break;
				case 'null': this.current = this.newToken(Token.NULL_LITERAL, range, new Literal<null>(null, undefined, undefined, undefined, range)); break;
				case 'undefined': this.current = this.newToken(Token.UNDEFINED_LITERAL, range, new Literal<undefined>(undefined, undefined, undefined, undefined, range)); break;
				case 'true': this.current = this.newToken(Token.TRUE_LITERAL, range, new Literal<boolean>(true, undefined, undefined, undefined, range)); break;
				case 'false': this.current = this.newToken(Token.FALSE_LITERAL, range, new Literal<boolean>(false, undefined, undefined, undefined, range)); break;

				case 'globalThis': this.current = this.newToken(Token.IDENTIFIER, range, new Identifier('globalThis', range)); break;
				case 'Symbol': this.current = this.newToken(Token.IDENTIFIER, range, new Identifier('Symbol', range)); break;
				case 'of': this.current = this.newToken(Token.IDENTIFIER, range, new Identifier('of', range)); break;
				case 'as': this.current = this.newToken(Token.IDENTIFIER, range, new Identifier('as', range)); break;
				case 'default': this.current = this.newToken(Token.DEFAULT, range, new Identifier('default', range)); break;
				case 'yield': this.current = this.newToken(Token.YIELD, range, new Identifier('yield', range)); break;
				case 'constructor': this.current = this.newToken(Token.IDENTIFIER, range, new Identifier('constructor', range)); break;
				case 'arguments': this.current = this.newToken(Token.IDENTIFIER, range, new Identifier('arguments', range)); break;
				case 'name': this.current = this.newToken(Token.IDENTIFIER, range, new Identifier('name', range)); break;
				case 'eval': this.current = this.newToken(Token.IDENTIFIER, range, new Identifier('eval', range)); break;
				case 'debugger': this.current = this.newToken(Token.DEBUGGER, range, new DebuggerStatement(range)); break;
				case 'class': this.current = this.newToken(Token.CLASS, range); break;
				case 'await': this.current = this.newToken(Token.AWAIT, range, new Identifier('await', range)); break;
				case 'async': this.current = this.newToken(Token.ASYNC, range, new Identifier('async', range)); break;

				default:
					node = new Identifier(identifierName, range);
					this.current = this.newToken(Token.IDENTIFIER, range, node);
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
	/**
	 * [JavaScript 5 Comment Types](https://developer.adobe.com/experience-manager/reference-materials/6-5/javadoc/org/mozilla/javascript/ast/Comment.html)
	 * @returns boolean
	 */
	private isComment() {
		const char = this.expression.charAt(this.pos);
		const nextChar = this.expression.charAt(this.pos + 1);
		let closeTag: string;
		let endPos: number;
		switch (true) {
			// // line comments
			case (char === '/' && nextChar === '/'):
				closeTag = '\n';
				endPos = this.expression.indexOf(closeTag, this.pos)
				break;
			// /* block comments *\/ and /** jsdoc comments *\/
			case (char === '/' && nextChar === '*'):
				closeTag = '*/';
				endPos = this.expression.indexOf(closeTag, this.pos);
				if (endPos === -1) {
					throw new SyntaxError(this.createError('Invalid or unexpected token'));
				}
				break;
			// <!-- html-open line comments
			case (char === '<' && nextChar === '!'):
				if ('<!--' === this.expression.substring(this.pos, this.pos + 4)) {
					if (isStrict(this.mode)) {
						throw new SyntaxError('Html Comment not allowed In Module');
					}
					const nextLinePos = this.expression.indexOf('\n', this.pos);
					const closePos = this.expression.indexOf('-->', this.pos);
					if (nextLinePos < closePos) {
						closeTag = '\n';
						endPos = nextLinePos;
					} else if (closePos < nextLinePos) {
						closeTag = '-->';
						endPos = closePos;
					} else {
						closeTag = '';
						endPos = -1;
					}
					break;
				}
			// ^\\s*--> html-close line comments
			case (char === '-' && nextChar === '-'):
				if ('-->' === this.expression.substring(this.pos, this.pos + 3)) {
					if (isStrict(this.mode)) {
						throw new SyntaxError('Html Comment not allowed In Module');
					}
					// check if '-->' is the first non-whitespace on the line
					let indexOfLastLine = this.expression.lastIndexOf('\n', this.pos + 1);
					if (indexOfLastLine == -1) {
						indexOfLastLine = 0;
					}
					let lastLine = this.expression.substring(indexOfLastLine, this.pos + 3);
					if (!/^\s*-->$/g.test(lastLine)) {
						// test with close of block comments
						let lastBlockCommentPos = lastLine.lastIndexOf('*/');
						if (lastBlockCommentPos == -1) {
							return false;
						}
						lastLine = lastLine.substring(lastBlockCommentPos + 2);
						if (!/^\s*-->$/g.test(lastLine)) {
							return false;
						}
					}
					endPos = this.expression.indexOf('\n', this.pos)
					closeTag = '\n';
					break;
				}
			default:
				return false;
		}
		this.pos = endPos == -1 ? this.expression.length : endPos + closeTag.length;
		return true;
	}
	private isLineTerminator(c: string) {
		return /[\n\r\u2028\u2029]/.test(c);
	}
	private isStringLiteralLineTerminator(c: string) {
		return /[\n\r]/.test(c);
	}
	private mayTerminateString(c: string) {
		return (c == '\'' || c == '"' || c == '\n' || c == '\r' || c == '\\');
	}
	public scanRegExpPattern() {
		const peek = this.peek();
		if (!(peek.isType(Token.DIV) || peek.isType(Token.DIV_ASSIGN))) {
			return false;
		}
		const start = this.pos;
		this.next();
		let pattern = peek.isType(Token.DIV_ASSIGN) ? '=' : '';
		let currentPos = this.pos;
		let inCharacterClass = false;
		let c = this.expression.charAt(currentPos);
		while (c !== '/' || inCharacterClass) {
			if (c == '' || this.isLineTerminator(c)) {
				return false;
			}
			if (c === '\\') {  // Escape sequence.
				pattern += c;
				c = this.expression.charAt(++currentPos);
				if (c == '' || this.isLineTerminator(c)) {
					return false;
				}
				pattern += c;
				c = this.expression.charAt(++currentPos);
			} else {
				if (c == '[') inCharacterClass = true;
				if (c == ']') inCharacterClass = false;
				pattern += c;
				c = this.expression.charAt(++currentPos);
			}
		}
		currentPos++;   // consume '/'

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
		const range: [number, number] = [start, currentPos];
		const regexNode = new Literal<RegExp>(new RegExp(pattern, flags), `/${pattern}/${flags}`, { pattern, flags }, undefined, range);
		this.current = this.newToken(Token.REGEXP_LITERAL, range, regexNode);
		this.pos = currentPos;
		return true;
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
						let codePoint = c;
						for (const i of [1, 2]) {
							const tempChar = v.charAt(index + i);
							if (!Number.isNaN(parseInt(tempChar, 8))) {
								codePoint += tempChar;
							} else {
								break;
							}
						}
						if (!TokenStreamImpl.AsciiPattern.test(codePoint)) {
							throw new Error(this.createError('Illegal escape sequence: ASCII 8 base, ' + codePoint));
						}
						buffer += String.fromCharCode(parseInt(codePoint, 8));
						index += codePoint.length;
						break;
					}
					index++;
					buffer += c;
					break;
				// throw new Error(this.createError('Illegal escape sequence: "\\' + c + '"'));
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
			const range: [number, number] = [this.pos, pos];
			const numNode = new Literal<number>(parseInt(string, radix), rawString, undefined, undefined, range);
			this.current = this.newToken(Token.NUMBER, range, numNode);
			this.pos = pos;
		}
		return valid;
	}
	private isNumber() {
		const startPos = this.pos;
		let valid = false;
		let pos = this.pos;
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
				pos++;
				const range: [number, number] = [startPos, this.pos];
				const bigintNode = new Literal<BigInt>(BigInt(rawString), rawString + 'n', undefined, rawString, range);
				this.current = this.newToken(Token.BIGINT, range, bigintNode);
			} else {
				let numNode: Literal<number>;
				const range: [number, number] = [startPos, this.pos];
				if (isOctal) {
					const octal = rawString.substring(2);
					if (TokenStreamImpl.OctalPattern.test(octal)) {
						numNode = new Literal<number>(parseInt(octal, 8), rawString, undefined, undefined, range);
					} else {
						return false;
					}
				} else {
					numNode = new Literal<number>(parseFloat(rawString), rawString, undefined, undefined, range);
				}
				this.current = this.newToken(Token.NUMBER, range, numNode);
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
					this.current = this.newToken(Token.INC, [this.pos, (this.pos += 2)]);
				} else if (this.expression.charAt(this.pos + 1) === '=') {
					this.current = this.newToken(Token.ADD_ASSIGN, [this.pos, (this.pos += 2)]);
				} else {
					this.current = this.newToken(Token.ADD, [this.pos, (this.pos += 1)]);
				}
				return true;
			case '-':
				if (this.expression.charAt(this.pos + 1) === '-') {
					this.current = this.newToken(Token.DEC, [this.pos, (this.pos += 2)]);
				} else if (this.expression.charAt(this.pos + 1) === '=') {
					this.current = this.newToken(Token.SUB_ASSIGN, [this.pos, (this.pos += 2)]);
				} else {
					this.current = this.newToken(Token.SUB, [this.pos, (this.pos += 1)]);
				}
				return true;
			case '=':
				if (this.expression.charAt(this.pos + 1) === '=') {
					if (this.expression.charAt(this.pos + 2) === '=') {
						this.current = this.newToken(Token.EQ_STRICT, [this.pos, (this.pos += 3)]);
					} else {
						this.current = this.newToken(Token.EQ, [this.pos, (this.pos += 2)]);
					}
				} else if (this.expression.charAt(this.pos + 1) === '>') {
					this.current = this.newToken(Token.ARROW, [this.pos, (this.pos += 2)]);
				} else {
					this.current = this.newToken(Token.ASSIGN, [this.pos, (this.pos += 1)]);
				}
				return true;
			case '*':
				if (this.expression.charAt(this.pos + 1) === '*') {
					if (this.expression.charAt(this.pos + 2) === '=') {
						this.current = this.newToken(Token.EXP_ASSIGN, [this.pos, (this.pos += 3)]);
					} else {
						this.current = this.newToken(Token.EXP, [this.pos, (this.pos += 2)]);
					}
				} else if (this.expression.charAt(this.pos + 1) === '=') {
					this.current = this.newToken(Token.MUL_ASSIGN, [this.pos, (this.pos += 2)]);
				} else {
					this.current = this.newToken(Token.MUL, [this.pos, (this.pos += 1)]);
				}
				return true;
			case '/':
				if (this.expression.charAt(this.pos + 1) === '=') {
					this.current = this.newToken(Token.DIV_ASSIGN, [this.pos, (this.pos += 2)]);
				} else {
					this.current = this.newToken(Token.DIV, [this.pos, (this.pos += 1)]);
				}
				return true;
			case '%':
				if (this.expression.charAt(this.pos + 1) === '%') {
					if (this.expression.charAt(this.pos + 1) === '=') {
						this.current = this.newToken(Token.MODULO_ASSIGN, [this.pos, (this.pos += 3)]);
					} else {
						this.current = this.newToken(Token.MODULO, [this.pos, (this.pos += 2)]);
					}
				} else if (this.expression.charAt(this.pos + 1) === '=') {
					this.current = this.newToken(Token.MOD_ASSIGN, [this.pos, (this.pos += 2)]);
				} else {
					this.current = this.newToken(Token.MOD, [this.pos, (this.pos += 1)]);
				}
				return true;
			case '^':
				if (this.expression.charAt(this.pos + 1) === '=') {
					this.current = this.newToken(Token.BIT_XOR_ASSIGN, [this.pos, (this.pos += 2)]);
				} else {
					this.current = this.newToken(Token.BIT_XOR, [this.pos, (this.pos += 1)]);
				}
				return true;
			case '>':
				if (this.expression.charAt(this.pos + 1) === '>') {
					if (this.expression.charAt(this.pos + 2) === '>') {
						if (this.expression.charAt(this.pos + 3) === '=') {
							this.current = this.newToken(Token.SHR_ASSIGN, [this.pos, (this.pos += 4)]);
						} else {
							this.current = this.newToken(Token.SHR, [this.pos, (this.pos += 3)]);
						}
					} else if (this.expression.charAt(this.pos + 2) === '=') {
						this.current = this.newToken(Token.SAR_ASSIGN, [this.pos, (this.pos += 3)]);
					} else {
						this.current = this.newToken(Token.SAR, [this.pos, (this.pos += 2)]);
					}
				} else if (this.expression.charAt(this.pos + 1) === '=') {
					this.current = this.newToken(Token.GTE, [this.pos, (this.pos += 2)]);
				} else if (this.expression.charAt(this.pos + 1) === '?') {
					if (this.expression.charAt(this.pos + 2) === '=') {
						this.current = this.newToken(Token.LARGER_ASSIGN, [this.pos, (this.pos += 3)]);
					} else {
						this.current = this.newToken(Token.LARGER, [this.pos, (this.pos += 2)]);
					}
				} else {
					this.current = this.newToken(Token.GT, [this.pos, (this.pos += 2)]);
				}
				return true;
			case '<':
				if (this.expression.charAt(this.pos + 1) === '<') {
					if (this.expression.charAt(this.pos + 2) === '=') {
						this.current = this.newToken(Token.SHL_ASSIGN, [this.pos, (this.pos += 3)]);
					} else {
						this.current = this.newToken(Token.SHL, [this.pos, (this.pos += 2)]);
					}
				} else if (this.expression.charAt(this.pos + 1) === '=') {
					if (this.expression.charAt(this.pos + 2) === '>') {
						this.current = this.newToken(Token.SPACESHIP, [this.pos, (this.pos += 3)]);
					} else {
						this.current = this.newToken(Token.LTE, [this.pos, (this.pos += 2)]);
					}
				} else if (this.expression.charAt(this.pos + 1) === '?') {
					if (this.expression.charAt(this.pos + 2) === '=') {
						this.current = this.newToken(Token.SMALLER_ASSIGN, [this.pos, (this.pos += 3)]);
					} else {
						this.current = this.newToken(Token.SMALLER, [this.pos, (this.pos += 2)]);
					}
				} else {
					this.current = this.newToken(Token.LT, [this.pos, (this.pos += 1)]);
				}
				return true;
			case '|':
				if (this.expression.charAt(this.pos + 1) === '|') {
					if (this.expression.charAt(this.pos + 2) === '=') {
						this.current = this.newToken(Token.OR_ASSIGN, [this.pos, (this.pos += 3)]);
					} else {
						this.current = this.newToken(Token.OR, [this.pos, (this.pos += 2)]);
					}
				} else if (this.expression.charAt(this.pos + 1) === '=') {
					this.current = this.newToken(Token.BIT_OR_ASSIGN, [this.pos, (this.pos += 2)]);
				} else if (this.expression.charAt(this.pos + 1) === '>') {
					this.current = this.newToken(Token.PIPELINE, [this.pos, (this.pos += 2)]);
				} else {
					this.current = this.newToken(Token.BIT_OR, [this.pos, (this.pos += 1)]);
				}
				return true;
			case '&':
				if (this.expression.charAt(this.pos + 1) === '&') {
					if (this.expression.charAt(this.pos + 2) === '=') {
						this.current = this.newToken(Token.AND_ASSIGN, [this.pos, (this.pos += 3)]);
					} else {
						this.current = this.newToken(Token.AND, [this.pos, (this.pos += 2)]);
					}
				} else if (this.expression.charAt(this.pos + 1) === '=') {
					this.current = this.newToken(Token.BIT_AND_ASSIGN, [this.pos, (this.pos += 2)]);
				} else {
					this.current = this.newToken(Token.BIT_AND, [this.pos, (this.pos += 1)]);
				}
				return true;
			case '?':
				if (this.expression.charAt(this.pos + 1) === '?') {
					if (this.expression.charAt(this.pos + 2) === '=') {
						this.current = this.newToken(Token.NULLISH_ASSIGN, [this.pos, (this.pos += 3)]);
					} else {
						this.current = this.newToken(Token.NULLISH, [this.pos, (this.pos += 2)]);
					}
				} else if (this.expression.substring(this.pos + 1, this.pos + 3) == '::') {
					this.current = this.newToken(Token.QUESTION_BIND, [this.pos, (this.pos += 3)]);
				} else if (this.expression.charAt(this.pos + 1) === '.') {
					this.current = this.newToken(Token.QUESTION_PERIOD, [this.pos, (this.pos += 2)]);
				} else {
					this.current = this.newToken(Token.CONDITIONAL, [this.pos, (this.pos += 1)]);
				}
				return true;
			case '!':
				if (this.expression.charAt(this.pos + 1) === '=') {
					if (this.expression.charAt(this.pos + 2) === '=') {
						this.current = this.newToken(Token.NE_STRICT, [this.pos, (this.pos += 3)]);
					} else {
						this.current = this.newToken(Token.NE, [this.pos, (this.pos += 2)]);
					}
				} else {
					this.current = this.newToken(Token.NOT, [this.pos, (this.pos += 1)]);
				}
				return true;
			case '.':
				if (/\.\.\./.test(this.expression.substring(this.pos, this.pos + 3))) {
					this.current = this.newToken(Token.ELLIPSIS, [this.pos, (this.pos += 3)]);
					return true;
				} else {
					this.current = this.newToken(Token.PERIOD, [this.pos, (this.pos += 1)]);
				}
				return true;
			// no break
			case ':':
				if (this.expression.charAt(this.pos + 1) === ':') {
					this.current = this.newToken(Token.QUESTION_BIND, [this.pos, (this.pos += 2)]);
				} else {
					this.current = this.newToken(Token.COLON, [this.pos, (this.pos += 1)]);
				}
				return true;
			case '~':
				this.current = this.newToken(Token.BIT_NOT, [this.pos, (this.pos += 1)]);
				return true;
			case 'a':
				if (/async\s/.test(this.expression.substring(this.pos, this.pos + 6))) {
					const range: [number, number] = [this.pos, (this.pos += 5)];
					this.current = this.newToken(Token.ASYNC, range, new Identifier('async', range));
					return true;
				}
				if (/await\s/.test(this.expression.substring(this.pos, this.pos + 6))) {
					const range: [number, number] = [this.pos, (this.pos += 5)];
					this.current = this.newToken(Token.AWAIT, range, new Identifier('await', range));
					return true;
				}
				return false;
			case 'i':			// in, instanceof
				if (this.expression.charAt(this.pos + 1) === 'n') {
					if (/instanceof\s/.test(this.expression.substring(this.pos, this.pos + 11))) {
						this.current = this.newToken(Token.INSTANCEOF, [this.pos, (this.pos += 11)]);
						return true;
					} else if (/n\s/.test(this.expression.charAt(this.pos + 2))) {
						this.current = this.newToken(Token.IN, [this.pos, (this.pos += 3)]);
						return true;
					}
				}
				return false;
			case 't':			// typeof
				if (/typeof\s/.test(this.expression.substring(this.pos, this.pos + 7))) {
					this.current = this.newToken(Token.TYPEOF, [this.pos, (this.pos += 7)]);
					return true;
				}
				return false;
			case 'v':			// void
				if (/void\s/.test(this.expression.substring(this.pos, this.pos + 5))) {
					this.current = this.newToken(Token.VOID, [this.pos, (this.pos += 5)]);
					return true;
				}
				return false;
			case 'd':			// delete
				if (/delete\s/.test(this.expression.substring(this.pos, this.pos + 7))) {
					this.current = this.newToken(Token.DELETE, [this.pos, (this.pos += 7)]);
					return true;
				}
				return false;
			case 'n':			// new
				if (/new\s/.test(this.expression.substring(this.pos, this.pos + 4))) {
					this.current = this.newToken(Token.NEW, [this.pos, (this.pos += 4)]);
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
					this.current = this.newToken(Token.BREAK, [this.pos, (this.pos += 5)]);
					return true;
				}
				return false;
			case 'c':
				if (/case[\s~!+-\/\('"`]/.test(this.expression.substring(this.pos, this.pos + 5))) {
					this.current = this.newToken(Token.CASE, [this.pos, (this.pos += 4)]);
					return true;
				} else if (/const\s/.test(this.expression.substring(this.pos, this.pos + 6))) {
					this.current = this.newToken(Token.CONST, [this.pos, (this.pos += 6)]);
					return true;
				} else if (/catch[\s\{\(]/.test(this.expression.substring(this.pos, this.pos + 6))) {
					this.current = this.newToken(Token.CATCH, [this.pos, (this.pos += 5)]);
					return true;
				} else if (/class\s/.test(this.expression.substring(this.pos, this.pos + 6))) {
					this.current = this.newToken(Token.CLASS, [this.pos, (this.pos += 6)]);
					return true;
				} else if (/continue[\s;]/.test(this.expression.substring(this.pos, this.pos + 9))) {
					this.current = this.newToken(Token.CONTINUE, [this.pos, (this.pos += 8)]);
					return true;
				}
				return false;
			case 'd':
				if (/do[\s|\{]/.test(this.expression.substring(this.pos, this.pos + 3))) {
					this.current = this.newToken(Token.DO, [this.pos, (this.pos += 2)]);
					return true;
				}
				return false;
			case 'e':
				if (/else[\s|\{]/.test(this.expression.substring(this.pos, this.pos + 5))) {
					this.current = this.newToken(Token.ELSE, [this.pos, (this.pos += 4)]);
					return true;
				}
				if (/export\s/.test(this.expression.substring(this.pos, this.pos + 7))) {
					this.current = this.newToken(Token.EXPORT, [this.pos, (this.pos += 7)]);
					return true;
				}
				if (/extends\s/.test(this.expression.substring(this.pos, this.pos + 8))) {
					this.current = this.newToken(Token.EXTENDS, [this.pos, (this.pos += 8)]);
					return true;
				}
				return false;
			case 'g':
				if (/get\s/.test(this.expression.substring(this.pos, this.pos + 4))) {
					const range: [number, number] = [this.pos, (this.pos += 4)];
					this.current = this.newToken(Token.GET, range, new Identifier('get', range));
					return true;
				}
				return false;
			case 'f':
				if (/for[\s\(]/.test(this.expression.substring(this.pos, this.pos + 4))) {
					this.current = this.newToken(Token.FOR, [this.pos, (this.pos += 3)]);
					return true;
				}
				if (/finally[\s\{]/.test(this.expression.substring(this.pos, this.pos + 8))) {
					this.current = this.newToken(Token.FINALLY, [this.pos, (this.pos += 7)]);
					return true;
				}
				if (/function[\s\*\(]/.test(this.expression.substring(this.pos, this.pos + 9))) {
					this.current = this.newToken(Token.FUNCTION, [this.pos, (this.pos += 8)]);
					return true;
				}
				return false;
			case 'i':
				if (/if[\s|\(]/.test(this.expression.substring(this.pos, this.pos + 3))) {
					this.current = this.newToken(Token.IF, [this.pos, (this.pos += 2)]);
					return true;
				} else if (/in\s/.test(this.expression.substring(this.pos, this.pos + 3))) {
					this.current = this.newToken(Token.IN, [this.pos, (this.pos += 3)]);
					return true;
				}
				else if (/import\s/.test(this.expression.substring(this.pos, this.pos + 7))) {
					this.current = this.newToken(Token.IMPORT, [this.pos, (this.pos += 7)]);
					return true;
				}
				return false;
			case 'l':
				if (/let\s/.test(this.expression.substring(this.pos, this.pos + 4))) {
					const range: [number, number] = [this.pos, (this.pos += 4)];
					this.current = this.newToken(Token.LET, range, new Identifier('let', range));
					return true;
				}
				return false;
			case 't':
				if (/try[\s\{]/.test(this.expression.substring(this.pos, this.pos + 4))) {
					this.current = this.newToken(Token.TRY, [this.pos, (this.pos += 3)]);
					return true;
				}
				if (/throw\s/.test(this.expression.substring(this.pos, this.pos + 6))) {
					this.current = this.newToken(Token.THROW, [this.pos, (this.pos += 6)]);
					return true;
				}
				return false;
			case 'r':
				if (/return[\s~!+-\/\('"`]/.test(this.expression.substring(this.pos, this.pos + 7))) {
					this.current = this.newToken(Token.RETURN, [this.pos, (this.pos += 6)]);
					return true;
				}
				return false;
			// case 'of':
			// 	if (/of\s/.test(this.expression.substring(this.pos, this.pos + 3))) {
			// 		this.current = this.newToken(Token.OF, [this.pos, (this.pos += 3)]);
			// 		return true;
			// 	}
			// 	return false;
			case 's':
				if (/switch(\s|\()/.test(this.expression.substring(this.pos, this.pos + 7))) {
					this.current = this.newToken(Token.SWITCH, [this.pos, (this.pos += 6)]);
					return true;
				}
				if (/static\s/.test(this.expression.substring(this.pos, this.pos + 7))) {
					this.current = this.newToken(Token.STATIC, [this.pos, (this.pos += 7)]);
					return true;
				}
				if (/set\s/.test(this.expression.substring(this.pos, this.pos + 4))) {
					const range: [number, number] = [this.pos, (this.pos += 4)];
					this.current = this.newToken(Token.SET, range, new Identifier('set', range));
					return true;
				}
				if (/super[\.\(]?/.test(this.expression.substring(this.pos, this.pos + 6))) {
					const range: [number, number] = [this.pos, (this.pos += 5)];
					this.current = this.newToken(Token.SUPER, range, new Super(range));
					return true;
				}
				return false;
			case 'w':
				if (/while(\s|\()/.test(this.expression.substring(this.pos, this.pos + 6))) {
					this.current = this.newToken(Token.WHILE, [this.pos, (this.pos += 5)]);
					return true;
				} else if (/with(\s|\()/.test(this.expression.substring(this.pos, this.pos + 5))) {
					this.current = this.newToken(Token.WITH, [this.pos, (this.pos += 4)]);
					return true;
				}
				return false;
			case 'v':
				if (/var\s/.test(this.expression.substring(this.pos, this.pos + 4))) {
					this.current = this.newToken(Token.VAR, [this.pos, (this.pos += 4)]);
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
			> token name: '${this.current?.token?.getName()}' ${this.current?.value ? `parsed: ${this.current.value.toString()}` : ''}
			> ${coords.line}:${coords.column}\t${errorAt}
			> ${coords.line}:${coords.column}\t${errorIndictor}
			`;
	}
}
