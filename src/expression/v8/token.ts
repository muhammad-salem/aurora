import type { ExpressionNode } from '../api/expression.js';

export class Token {

	/**
	 * ___ ? ___ : ___
	 */
	public static readonly CONDITIONAL = new Token('?', 3);

	/**
	 * ___ ?? ___
	 */
	public static readonly NULLISH = new Token('??', 3);

	/**
	 * ___ |> ___ : ___ : ?
	 * ___ |> ___ ( ___, ___ ,? )
	 */
	public static readonly PIPELINE = new Token('|>', 4);

	/**
	 * ___ || ___
	 */
	public static readonly OR = new Token('||', 4);

	/**
	 * ___ && ___
	 */
	public static readonly AND = new Token('&&', 5);

	/**
	 * ___ | ___
	 */
	public static readonly BIT_OR = new Token('|', 6);

	/**
	 * ___ ^ ___
	 */
	public static readonly BIT_XOR = new Token('^', 7);

	/**
	 * ___ | ___
	 */
	public static readonly BIT_AND = new Token('&', 8);

	/**
	 * ___ << ___
	 */
	public static readonly SHL = new Token('<<', 11);

	/**
	 * ___ >> ___
	 */
	public static readonly SAR = new Token('>>', 11);

	/**
	 * ___ >>> ___
	 */
	public static readonly SHR = new Token('>>>', 11);

	/**
	 * ___ * ___
	 */
	public static readonly MUL = new Token('*', 13);

	/**
	 * ___ / ___
	 */
	public static readonly DIV = new Token('/', 13);

	/**
	 * ___ % ___
	 */
	public static readonly MOD = new Token('%', 13);

	/**
	 * ___ ** ___
	 */
	public static readonly EXP = new Token('**', 14);

	/**
	 * ___ + ___
	 */
	public static readonly ADD = new Token('+', 12);

	/**
	 * ___ - ___
	 */
	public static readonly SUB = new Token('-', 12);

	/**
	 * ! ___
	 */
	public static readonly NOT = new Token('!', 0);

	/**
	 * ~ ___
	 */
	public static readonly BIT_NOT = new Token('~', 0);

	/**
	 * ___ < ___
	 */
	public static readonly LT = new Token('<', 10);

	/**
	 * ___ > ___
	 */
	public static readonly GT = new Token('>', 10);

	/**
	 * ___++,  ++___
	 */
	public static readonly INC = new Token('++', 0);

	/**
	 * ___--, --___
	 */
	public static readonly DEC = new Token('--', 0);

	/**
	 * ___ == ___
	 */
	public static readonly EQ = new Token('==', 9);

	/**
	 * ___ === ___
	 */
	public static readonly EQ_STRICT = new Token('===', 9);

	/**
	 * ___ != ___
	 */
	public static readonly NE = new Token('!=', 9);

	/**
	 * ___ !== ___
	 */
	public static readonly NE_STRICT = new Token('!==', 9);

	/**
	 * ___ <= ___
	 */
	public static readonly LTE = new Token('<=', 10);

	/**
	 * ___ >= ___
	 */
	public static readonly GTE = new Token('>=', 10);

	/**
	 * ___ = ___
	 */
	public static readonly ASSIGN = new Token('=', 2);

	/**
	 * ___ += ___
	 */
	public static readonly ADD_ASSIGN = new Token('+=', 2);

	/**
	 * ___ -= ___
	 */
	public static readonly SUB_ASSIGN = new Token('-=', 2);

	/**
	 * ___ *= ___
	 */
	public static readonly MUL_ASSIGN = new Token('*=', 2);

	/**
	 * ___ /= ___
	 */
	public static readonly DIV_ASSIGN = new Token('/=', 2);

	/**
	 * ___ %= ___
	 */
	public static readonly MOD_ASSIGN = new Token('%=', 2);

	/**
	 * ___ **= ___
	 */
	public static readonly EXP_ASSIGN = new Token('**=', 2);

	/**
	 * ___ ^= ___
	 */
	public static readonly BIT_XOR_ASSIGN = new Token('^=', 2);

	/**
	 * ___ &= ___
	 */
	public static readonly BIT_AND_ASSIGN = new Token('&=', 2);

	/**
	 * ___ |= ___
	 */
	public static readonly BIT_OR_ASSIGN = new Token('|=', 2);

	/**
	 * ___ &&= ___
	 */
	public static readonly AND_ASSIGN = new Token('&&=', 2);

	/**
	 * ___ ||= ___
	 */
	public static readonly OR_ASSIGN = new Token('||=', 2);

	/**
	 * ___ ??= ___
	 */
	public static readonly NULLISH_ASSIGN = new Token('??=', 2);

	/**
	 * ___ <<= ___
	 */
	public static readonly SHL_ASSIGN = new Token('<<=', 2);

	/**
	 * ___ >>= ___
	 */
	public static readonly SAR_ASSIGN = new Token('>>=', 2);

	/**
	 * ___ >>>= ___
	 */
	public static readonly SHR_ASSIGN = new Token('>>>=', 2);

	/**
	 * ___ <=> ___
	 */
	public static readonly SPACESHIP = new Token('<=>', 2);

	/**
	 * ___ . ___
	 */
	public static readonly PERIOD = new Token('.', 0);

	/**
	 * ___ ?. ___, ___?.[___], ___?.()
	 */
	public static readonly QUESTION_PERIOD = new Token('?.', 0);

	/**
	 * (
	 */
	public static readonly L_PARENTHESES = new Token('(', 0);

	/**
	 * )
	 */
	public static readonly R_PARENTHESES = new Token(')', 0);

	/**
	 * [
	 */
	public static readonly L_BRACKETS = new Token('[', 0);

	/**
	 * ]
	 */
	public static readonly R_BRACKETS = new Token(']', 0);

	/**
	 * {
	 */
	public static readonly L_CURLY = new Token('{', 0);

	/**
	 * }
	 */
	public static readonly R_CURLY = new Token('}', 0);

	/**
	 * :
	 */
	public static readonly COLON = new Token(':', 0);

	/**
	 * ...
	 */
	public static readonly ELLIPSIS = new Token('...', 0);

	/**
	 * ;
	 */
	public static readonly SEMICOLON = new Token(';', 0);

	/**
	 * end of source
	 */
	public static readonly EOS = new Token('EOS', 0);

	/**
	 * =>
	 */
	public static readonly ARROW = new Token('=>', 0);

	/**
	 * ___, ___, ___
	 */
	public static readonly COMMA = new Token(',', 1);
	public static readonly ASYNC = new Token('async', 0);
	public static readonly AWAIT = new Token('await', 0);
	public static readonly BREAK = new Token('break', 0);
	public static readonly CASE = new Token('case', 0);
	public static readonly CATCH = new Token('catch', 0);
	public static readonly CLASS = new Token('class', 0);
	public static readonly CONST = new Token('const', 0);
	public static readonly CONTINUE = new Token('continue', 0);
	public static readonly DEBUGGER = new Token('debugger', 0);
	public static readonly DEFAULT = new Token('default', 0);
	public static readonly DELETE = new Token('delete', 0);
	public static readonly DO = new Token('do', 0);
	public static readonly ELSE = new Token('else', 0);
	public static readonly ENUM = new Token('enum', 0);
	public static readonly EXPORT = new Token('export', 0);
	public static readonly EXTENDS = new Token('extends', 0);
	public static readonly FALSE_LITERAL = new Token('false', 0);
	public static readonly FINALLY = new Token('finally', 0);
	public static readonly FOR = new Token('for', 0);
	public static readonly FUNCTION = new Token('function', 0);
	public static readonly GET = new Token('get', 0);
	public static readonly IF = new Token('if', 0);
	public static readonly IMPLEMENTS = new Token('implements', 0);
	public static readonly IMPORT = new Token('import', 0);
	public static readonly IN = new Token('in', 10);
	public static readonly INSTANCEOF = new Token('instanceof', 10);
	public static readonly INTERFACE = new Token('interface', 10);
	public static readonly LET = new Token('let', 0);
	public static readonly NEW = new Token('new', 0);
	public static readonly NULL_LITERAL = new Token('null', 0);
	public static readonly UNDEFINED_LITERAL = new Token('undefined', 0);
	public static readonly PACKAGE = new Token('package', 0);
	public static readonly PRIVATE = new Token('private', 0);
	public static readonly PROTECTED = new Token('protected', 0);
	public static readonly PUBLIC = new Token('public', 0);
	public static readonly RETURN = new Token('return', 0);
	public static readonly SET = new Token('set', 0);
	public static readonly STATIC = new Token('static', 0);
	public static readonly SUPER = new Token('super', 0);
	public static readonly SWITCH = new Token('switch', 0);
	public static readonly THIS = new Token('this', 0);
	public static readonly THROW = new Token('throw', 0);
	public static readonly TRUE_LITERAL = new Token('true', 0);
	public static readonly TRY = new Token('try', 0);
	public static readonly TYPEOF = new Token('typeof', 0);
	public static readonly VAR = new Token('var', 0);
	public static readonly VOID = new Token('void', 0);
	public static readonly WHILE = new Token('while', 0);
	public static readonly YIELD = new Token('yield', 0);
	public static readonly NUMBER = new Token('NUMBER', 0);
	public static readonly BIGINT = new Token('BIGINT', 0);
	public static readonly STRING = new Token('STRING', 0);
	public static readonly IDENTIFIER = new Token('IDENTIFIER', 0);
	public static readonly TEMPLATE_SPAN = new Token("TEMPLATE_SPAN", 0);
	public static readonly TEMPLATE_TAIL = new Token("TEMPLATE_TAIL", 0);
	public static readonly ILLEGAL = new Token('ILLEGAL', 0);
	public static readonly ESCAPED_KEYWORD = new Token('ESCAPED_KEYWORD', 0);
	public static readonly WHITESPACE = new Token('WHITESPACE', 0);
	public static readonly REGEXP_LITERAL = new Token('REGEXP_LITERAL', 0);


	public static isPair(token: Token): boolean {
		switch (token) {
			case Token.L_PARENTHESES:
			case Token.L_BRACKETS:
			case Token.L_CURLY:
			case Token.R_CURLY:
			case Token.R_BRACKETS:
			case Token.R_PARENTHESES:
				return true;
			default:
				return false;
		}
	}
	public static isOpenPair(token: Token): boolean {
		switch (token) {
			case Token.L_PARENTHESES:
			case Token.L_BRACKETS:
			case Token.L_CURLY:
				return true;
			default:
				return false;
		}
	}
	public static isClosePair(token: Token): boolean {
		switch (token) {
			case Token.R_CURLY:
			case Token.R_BRACKETS:
			case Token.R_PARENTHESES:
				return true;
			default:
				return false;
		}
	}
	public static openOf(token: Token): Token {
		switch (token) {
			case Token.R_CURLY:
				return Token.L_CURLY;
			case Token.R_BRACKETS:
				return Token.L_BRACKETS;
			case Token.R_PARENTHESES:
				return Token.L_PARENTHESES;
		}
		return token;
	}
	public static closeOf(token: Token): Token {
		switch (token) {
			case Token.L_CURLY:
				return Token.R_CURLY;
			case Token.L_BRACKETS:
				return Token.R_BRACKETS;
			case Token.L_PARENTHESES:
				return Token.R_PARENTHESES;
		}
		return token;
	}
	public static isAnyIdentifier(token: Token): boolean {
		switch (token) {
			case Token.IDENTIFIER:
			case Token.GET:
			case Token.SET:
			case Token.ASYNC:
			case Token.AWAIT:
			case Token.YIELD:
			case Token.LET:
			case Token.STATIC:
				return true;
		}
		return false;
	}
	public static isIdentifier(token: Token): boolean {
		switch (token) {
			case Token.IDENTIFIER:
			case Token.GET:
			case Token.SET:
			case Token.ASYNC:
				return true;
		}
		return false;
	}
	public static isLiteral(token: Token): boolean {
		switch (token) {
			case Token.UNDEFINED_LITERAL:
			case Token.NULL_LITERAL:
			case Token.TRUE_LITERAL:
			case Token.FALSE_LITERAL:
			case Token.NUMBER:
			case Token.BIGINT:
			case Token.STRING:
			case Token.REGEXP_LITERAL:
				// case Token.SMI:
				return true;
		}
		return false;
	}
	public static isArrowOrAssignmentOp(token: Token) {
		return token === Token.ARROW || this.isAssignment(token);
	}
	public static isAssignment(token: Token): boolean {
		switch (token) {
			case Token.ASSIGN:
			case Token.ADD_ASSIGN:
			case Token.SUB_ASSIGN:
			case Token.MUL_ASSIGN:
			case Token.DIV_ASSIGN:
			case Token.MOD_ASSIGN:
			case Token.EXP_ASSIGN:
			case Token.BIT_XOR_ASSIGN:
			case Token.BIT_AND_ASSIGN:
			case Token.BIT_OR_ASSIGN:
			case Token.AND_ASSIGN:
			case Token.OR_ASSIGN:
			case Token.NULLISH_ASSIGN:
			case Token.SHL_ASSIGN:
			case Token.SAR_ASSIGN:
			case Token.SHR_ASSIGN:
				return true;
		}
		return false;
	}
	public static isLogicalAssignmentOp(token: Token) {
		switch (token) {
			case Token.AND_ASSIGN:
			case Token.OR_ASSIGN:
			case Token.NULLISH_ASSIGN:
				return true;
		}
		return false;
	}
	public static isAutoSemicolon(token: Token) {
		switch (token) {
			case Token.SEMICOLON:
			case Token.R_CURLY:
			case Token.EOS:
				return true;
		}
		return false;
	}
	public static isMember(token: Token): boolean {
		switch (token) {
			case Token.PERIOD:
			case Token.L_BRACKETS:
				return true;
		}
		return false;
	}
	public static isTemplate(token: Token): boolean {
		switch (token) {
			case Token.TEMPLATE_SPAN:
			case Token.TEMPLATE_TAIL:
				return true;
		}
		return false;
	}

	public static isNextLetKeyword(token: Token) {
		switch (token) {
			case Token.L_CURLY:
			case Token.L_BRACKETS:
			case Token.IDENTIFIER:
			case Token.STATIC:
			case Token.LET:  // `let let;` is disallowed by static semantics, but the
			// token must be first interpreted as a keyword in order
			// for those semantics to apply. This ensures that ASI is
			// not honored when a LineTerminator separates the tokens.
			case Token.YIELD:
			case Token.AWAIT:
			case Token.GET:
			case Token.SET:
			case Token.ASYNC:
				return true;
			// case Token.FUTURE_STRICT_RESERVED_WORD:
			// return is_sloppy(language_mode());
			default:
				return false;
		}
	}

	public static isPropertyOrCall(token: Token) {
		switch (token) {
			case Token.TEMPLATE_SPAN:
			case Token.TEMPLATE_TAIL:
			case Token.PERIOD:
			case Token.L_BRACKETS:
			case Token.QUESTION_PERIOD:
			case Token.L_PARENTHESES:
				return true;
		}
		return false;
	}
	private static isInRange(op: number, start: Token, end: Token) {
		return op >= start.precedence && op <= end.precedence;
	}
	public static isBinary(token: number | Token) {
		if (token instanceof Token) {
			token = token.precedence;
		}
		return Token.isInRange(token, Token.COMMA, Token.SUB);
	}

	public static isCompare(token: Token) {
		switch (token) {
			case Token.EQ:
			case Token.EQ_STRICT:
			case Token.NE:
			case Token.NE_STRICT:
			case Token.LT:
			case Token.GT:
			case Token.LTE:
			case Token.GTE:
			case Token.INSTANCEOF:
			case Token.IN:
				return true;
		}
		return false;
	}

	public static isOrderedRelationalCompare(token: Token) {
		switch (token) {
			case Token.LT:
			case Token.GT:
			case Token.LTE:
			case Token.GTE:
				return true;
		}
		return false;
	}

	public static isEquality(token: Token) {
		switch (token) {
			case Token.EQ:
			case Token.EQ_STRICT:
				return true;
		}
		return false;
	}

	public static binaryOpForAssignment(token: Token) {
		if (Token.isInRange(token.precedence, Token.NULLISH_ASSIGN, Token.SUB_ASSIGN)) {
			const result = token.precedence - Token.NULLISH_ASSIGN.precedence + Token.NULLISH.precedence;
			return Token.isBinary(result);
		}
		return false;
	}

	public static isBitOp(token: Token) {
		switch (token) {
			case Token.BIT_NOT:
			case Token.BIT_OR:
			case Token.BIT_XOR:
			case Token.BIT_AND:
			case Token.SHL:
			case Token.SAR:
			case Token.SHR:
				return true;
		}
		return false;
	}

	static isUnary(token: Token) {
		switch (token) {
			case Token.NOT:
			case Token.BIT_NOT:
			case Token.DELETE:
			case Token.AWAIT:
			case Token.TYPEOF:
			case Token.VOID:
				return true;
		}
		return false;
	}
	public static isCount(token: Token) {
		switch (token) {
			case Token.INC:
			case Token.DEC:
				return true;
		}
		return false;
	}
	public static isUnaryOrCount(token: Token) {
		switch (token) {
			case Token.ADD:
			case Token.SUB:
			case Token.INC:
			case Token.DEC:
			case Token.NOT:
			case Token.BIT_NOT:
			case Token.DELETE:
			case Token.AWAIT:
			case Token.TYPEOF:
			case Token.VOID:
				return true;
		}
		return false;
	}
	public static isShift(token: Token) {
		switch (token) {
			case Token.SHL:
			case Token.SAR:
			case Token.SHR:
				return true;
		}
		return false;
	}

	constructor(private token: string, private precedence: number) { }
	jsToken() {
		return this.token;
	}
	jsPrecedence() {
		return this.precedence;
	}
}

export class TokenExpression {
	constructor(public token: Token, public value?: ExpressionNode) { }
	getValue(): ExpressionNode {
		return this.value!;
	}
	isType(type: Token) {
		return this.token === type;
	}
	isNotType(type: Token) {
		return this.token !== type;
	}

	test(func: (token: Token) => boolean): boolean {
		return func(this.token);
	}

}
