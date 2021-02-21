import { BigIntNode, NumberNode, PropertyNode, RegExpNode, StringNode } from '../api/definition/values.js';
import type { ExpressionNode } from '../api/expression.js';
import { Token, TokenType } from './token.js';

export class TokenStream {
	static REGEXP_FLAGS = ['g', 'i', 'm', 's', 'u', 'y'];

	static OPERATORS = [
		'!', '!=', '!==', '%', '%=',
		'&', '&&', '&&=', '&=',
		'*', '*=', '+', '++', '+=',
		'-', '--', '-=', '.', '...',
		'/', '/=', ':',
		'<', '<<', '<<=', '<=', '=', '==', '===',
		'>', '>=', '>>', '>>=', '>>>', '>>>=',
		'?', '?.', '^', '^=', '~',
		'|', '|>', '|=', '||', '||='
	];
	static CodePointPattern = /^[0-9a-f]{4}$/i;

	pos = 0;
	savedPosition = 0;

	current: Token;
	savedCurrent: Token;

	constructor(private expression: string) { }

	private newToken(type: TokenType, value: string | ExpressionNode): Token {
		return new Token(type, value);
	}

	save() {
		this.savedPosition = this.pos;
		this.savedCurrent = this.current;
	}

	restore(): void {
		this.pos = this.savedPosition;
		this.current = this.savedCurrent;
	}

	next(): Token {
		if (this.pos >= this.expression.length) {
			return this.newToken(TokenType.EOF, 'EOF');
		}
		if (this.isWhitespace() || this.isComment()) {
			return this.next();
		} else if (this.isRadixInteger()
			|| this.isNumber()
			|| this.isRegExp()
			|| this.isOperator()
			|| this.isString()
			|| this.isProperty()
			|| this.isCurlY()
			|| this.isParentheses()
			|| this.isBracket()
			|| this.isComma()
			|| this.isSemicolon()
		) {
			return this.current;
		} else {
			throw this.parseError('Unknown character "' + this.expression.charAt(this.pos) + '"');
		}
	}

	isString() {
		let result = false;
		let startPos = this.pos;
		let quote = this.expression.charAt(startPos);

		if (quote === '\'' || quote === '"' || quote === '`') {
			let index = this.expression.indexOf(quote, startPos + 1);
			while (index >= 0 && this.pos < this.expression.length) {
				this.pos = index + 1;
				if (this.expression.charAt(index - 1) !== '\\') {
					const rawString = this.expression.substring(startPos + 1, index);
					const stringNode = new StringNode(this.unescape(rawString));
					this.current = this.newToken(TokenType.EXPRESSION, stringNode);
					result = true;
					break;
				}
				index = this.expression.indexOf(quote, index + 1);
			}
		}
		return result;
	}

	isParentheses() {
		const c = this.expression.charAt(this.pos);
		if (c === '(') {
			this.current = this.newToken(TokenType.OPEN_PARENTHESES, c);
			this.pos++;
			return true;
		} else if (c === ')') {
			this.current = this.newToken(TokenType.CLOSE_PARENTHESES, c);
			this.pos++;
			return true;
		}
		return false;
	}

	isBracket() {
		const c = this.expression.charAt(this.pos);
		if (c === '[') {
			this.current = this.newToken(TokenType.OPEN_BRACKETS, c);
			this.pos++;
			return true;
		} else if (c === ']') {
			this.current = this.newToken(TokenType.CLOSE_BRACKETS, c);
			this.pos++;
			return true;
		}
		return false;
	}

	isCurlY() {
		const c = this.expression.charAt(this.pos);
		if (c === '{') {
			this.current = this.newToken(TokenType.OPEN_CURLY, c);
			this.pos++;
			return true;
		} else if (c === '}') {
			this.current = this.newToken(TokenType.CLOSE_CURLY, c);
			this.pos++;
			return true;
		}
		return false;
	}

	isComma() {
		const c = this.expression.charAt(this.pos);
		if (c === ',') {
			this.current = this.newToken(TokenType.COMMA, ',');
			this.pos++;
			return true;
		}
		return false;
	}

	isSemicolon() {
		const c = this.expression.charAt(this.pos);
		if (c === ';') {
			this.current = this.newToken(TokenType.SEMICOLON, ';');
			this.pos++;
			return true;
		}
		return false;
	}

	isProperty() {
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
			this.current = this.newToken(TokenType.EXPRESSION, new PropertyNode(str));
			this.pos += str.length;
			return true;
		}
		return false;
	}

	isWhitespace() {
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

	isComment() {
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

	isRegExp() {
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
			while (TokenStream.REGEXP_FLAGS.indexOf((nextChar = this.expression.charAt(this.pos + 1))) > -1) {
				flags += nextChar;
				this.pos++;
			}
			const regexNode = new RegExpNode(new RegExp(pattern, flags));
			this.current = this.newToken(TokenType.EXPRESSION, regexNode);
			return true;
		}
		return false;
	}

	unescape(v: string) {
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
					if (!TokenStream.CodePointPattern.test(codePoint)) {
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

	isRadixInteger() {
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
			this.current = this.newToken(TokenType.EXPRESSION, numNode);
			this.pos = pos;
		}
		return valid;
	}

	isNumber() {
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
				this.current = this.newToken(TokenType.EXPRESSION, bigintNode);
				pos++;
			} else {
				const numNode = new NumberNode(parseFloat(this.expression.substring(startPos, pos)));
				this.current = this.newToken(TokenType.EXPRESSION, numNode);
			}
			this.pos = pos;
		} else {
			this.pos = resetPos;
		}
		return valid;
	}

	isOperator() {
		const char = this.expression.charAt(this.pos);
		switch (char) {
			case '+':
				if (this.expression.charAt(this.pos + 1) === '+') {
					this.current = this.newToken(TokenType.OPERATOR, '++');
					this.pos += 2;
				} else if (this.expression.charAt(this.pos + 1) === '=') {
					this.current = this.newToken(TokenType.OPERATOR, '+=');
					this.pos += 2;
				} else {
					this.current = this.newToken(TokenType.OPERATOR, '+');
					this.pos++;
				}
				return true;
			case '-':
				if (this.expression.charAt(this.pos + 1) === '-') {
					this.current = this.newToken(TokenType.OPERATOR, '--');
					this.pos += 2;
				} else if (this.expression.charAt(this.pos + 1) === '=') {
					this.current = this.newToken(TokenType.OPERATOR, '-=');
					this.pos += 2;
				} else {
					this.current = this.newToken(TokenType.OPERATOR, '-');
					this.pos++;
				}
				return true;
			case '=':
				if (this.expression.charAt(this.pos + 1) === '=') {
					if (this.expression.charAt(this.pos + 2) === '=') {
						this.current = this.newToken(TokenType.OPERATOR, '===');
						this.pos += 3;
					} else {
						this.current = this.newToken(TokenType.OPERATOR, '==');
						this.pos += 2;
					}
				} else {
					this.current = this.newToken(TokenType.OPERATOR, '=');
					this.pos++;
				}
				return true;
			case '*':
				if (this.expression.charAt(this.pos + 1) === '*') {
					if (this.expression.charAt(this.pos + 2) === '=') {
						this.current = this.newToken(TokenType.OPERATOR, '**=');
						this.pos += 3;
					} else {
						this.current = this.newToken(TokenType.OPERATOR, '**');
						this.pos += 2;
					}
				} else if (this.expression.charAt(this.pos + 1) === '=') {
					this.current = this.newToken(TokenType.OPERATOR, '*=');
					this.pos += 2;
				} else {
					this.current = this.newToken(TokenType.OPERATOR, '*');
					this.pos++;
				}
				return true;
			case '/':
				if (this.expression.charAt(this.pos + 1) === '=') {
					this.current = this.newToken(TokenType.OPERATOR, '/=');
					this.pos += 2;
				} else {
					this.current = this.newToken(TokenType.OPERATOR, '/');
					this.pos++;
				}
				return true;
			case '%':
				if (this.expression.charAt(this.pos + 1) === '=') {
					this.current = this.newToken(TokenType.OPERATOR, '%=');
					this.pos += 2;
				} else {
					this.current = this.newToken(TokenType.OPERATOR, '%');
					this.pos++;
				}
				return true;
			case '^':
				if (this.expression.charAt(this.pos + 1) === '=') {
					this.current = this.newToken(TokenType.OPERATOR, '^=');
					this.pos += 2;
				} else {
					this.current = this.newToken(TokenType.OPERATOR, '^');
					this.pos++;
				}
				return true;
			case '>':
				if (this.expression.charAt(this.pos + 1) === '>') {
					if (this.expression.charAt(this.pos + 2) === '>') {
						if (this.expression.charAt(this.pos + 3) === '=') {
							this.current = this.newToken(TokenType.OPERATOR, '>>>=');
							this.pos += 4;
						} else {
							this.current = this.newToken(TokenType.OPERATOR, '>>>');
							this.pos += 3;
						}
					} else if (this.expression.charAt(this.pos + 2) === '=') {
						this.current = this.newToken(TokenType.OPERATOR, '>>=');
						this.pos += 3;
					} else {
						this.current = this.newToken(TokenType.OPERATOR, '>>');
						this.pos += 2;
					}
				} else if (this.expression.charAt(this.pos + 1) === '=') {
					this.current = this.newToken(TokenType.OPERATOR, '>=');
					this.pos += 2;
				} else {
					this.current = this.newToken(TokenType.OPERATOR, '>');
					this.pos++;
				}
				return true;
			case '<':
				if (this.expression.charAt(this.pos + 1) === '<') {
					if (this.expression.charAt(this.pos + 2) === '=') {
						this.current = this.newToken(TokenType.OPERATOR, '<<=');
						this.pos += 3;
					} else {
						this.current = this.newToken(TokenType.OPERATOR, '<<');
						this.pos += 2;
					}
				} else if (this.expression.charAt(this.pos + 1) === '=') {
					this.current = this.newToken(TokenType.OPERATOR, '<=');
					this.pos += 2;
				} else {
					this.current = this.newToken(TokenType.OPERATOR, '<');
					this.pos++;
				}
				return true;
			case '|':
				if (this.expression.charAt(this.pos + 1) === '|') {
					if (this.expression.charAt(this.pos + 2) === '=') {
						this.current = this.newToken(TokenType.OPERATOR, '||=');
						this.pos += 3;
					} else {
						this.current = this.newToken(TokenType.OPERATOR, '||');
						this.pos += 2;
					}
				} else if (this.expression.charAt(this.pos + 1) === '=') {
					this.current = this.newToken(TokenType.OPERATOR, '|=');
					this.pos += 2;
				} else if (this.expression.charAt(this.pos + 1) === '>') {
					this.current = this.newToken(TokenType.OPERATOR, '|>');
					this.pos += 2;
				} else {
					this.current = this.newToken(TokenType.OPERATOR, '|');
					this.pos++;
				}
				return true;
			case '&':
				if (this.expression.charAt(this.pos + 1) === '&') {
					if (this.expression.charAt(this.pos + 2) === '=') {
						this.current = this.newToken(TokenType.OPERATOR, '&&=');
						this.pos += 3;
					} else {
						this.current = this.newToken(TokenType.OPERATOR, '&&');
						this.pos += 2;
					}
				} else if (this.expression.charAt(this.pos + 1) === '=') {
					this.current = this.newToken(TokenType.OPERATOR, '&=');
					this.pos += 2;
				} else {
					this.current = this.newToken(TokenType.OPERATOR, '&');
					this.pos++;
				}
				return true;
			case '?':
				if (this.expression.charAt(this.pos + 1) === '?') {
					if (this.expression.charAt(this.pos + 1) === '=') {
						this.current = this.newToken(TokenType.OPERATOR, '??=');
						this.pos += 3;
					} else {
						this.current = this.newToken(TokenType.OPERATOR, '??');
						this.pos += 2;
					}
				} else if (this.expression.charAt(this.pos + 1) === '.') {
					this.current = this.newToken(TokenType.OPERATOR, '?.');
					this.pos += 2;
				} else {
					this.current = this.newToken(TokenType.OPERATOR, '?');
					this.pos++;
				}
				return true;
			case '!':
				if (this.expression.charAt(this.pos + 1) === '=') {
					if (this.expression.charAt(this.pos + 2) === '=') {
						this.current = this.newToken(TokenType.OPERATOR, '!==');
						this.pos += 3;
					} else {
						this.current = this.newToken(TokenType.OPERATOR, '!=');
						this.pos += 2;
					}
				} else {
					this.current = this.newToken(TokenType.OPERATOR, '!');
					this.pos++;
				}
				return true;
			case '.':
				if (this.expression.substring(this.pos, 3) === '...') {
					this.current = this.newToken(TokenType.OPERATOR, '...');
					this.pos += 3;
					return true;
				}
			// no break
			case ':':
			case '~':
				this.current = this.newToken(TokenType.OPERATOR, char);
				this.pos++;
				return true;
			case 'i':			// in, instanceof
				if (this.expression.charAt(this.pos + 1) === 'n') {
					if (this.expression.substring(this.pos, 10) === 'instanceof') {
						this.current = this.newToken(TokenType.OPERATOR, 'instanceof');
						this.pos += 10;
					} else {
						this.current = this.newToken(TokenType.OPERATOR, 'in');
						this.pos += 2;
					}
					return true;
				}
				return false;
			case 't':			// typeof
				if (this.expression.substring(this.pos, 6) === 'typeof') {
					this.current = this.newToken(TokenType.OPERATOR, 'typeof');
					this.pos += 6;
					return true;
				}
				return false;
			case 'v':			// void
				if (this.expression.substring(this.pos, 4) === 'void') {
					this.current = this.newToken(TokenType.OPERATOR, 'void');
					this.pos += 4;
					return true;
				}
				return false;
			case 'd':			// delete
				if (this.expression.substring(this.pos, 6) === 'delete') {
					this.current = this.newToken(TokenType.OPERATOR, 'delete');
					this.pos += 6;
					return true;
				}
				return false;
			case 'n':			// new
				if (this.expression.substring(this.pos, 3) === 'new') {
					this.current = this.newToken(TokenType.OPERATOR, 'new');
					this.pos += 3;
					return true;
				}
				return false;
			case 'a':			// await, async
				const nextStr = this.expression.substring(this.pos, 5);
				if ('await' === nextStr || 'async' === nextStr) {
					this.current = this.newToken(TokenType.OPERATOR, nextStr);
					this.pos += 5;
					return true;
				}
				return false;
			default:
				return false;
		}
	}

	getCoordinates() {
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

	parseError(message: String): Error {
		let coords = this.getCoordinates();
		return new Error('parse error [' + coords.line + ':' + coords.column + ']: ' + message);
	}

}
