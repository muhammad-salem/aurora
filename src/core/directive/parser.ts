import { Identifier, Token, TokenExpression, TokenStream } from '@ibyar/expressions';

export type DirectiveExpressionType = {
	templateExpressions: Array<TokenExpression[]>;
	directiveInputs: Map<string, string>;
};

class TokenConstant {
	static LET = new TokenExpression(Token.LET, [-1, -1]);
	static COMMA = new TokenExpression(Token.COMMA, [-1, -1]);
	static ASSIGN = new TokenExpression(Token.ASSIGN, [-1, -1]);
	static IMPLICIT = new TokenExpression(Token.IDENTIFIER, [-1, -1], new Identifier('$implicit'));
	static EOS = new TokenExpression(Token.EOS, [-1, -1]);
}

export class DirectiveExpressionParser {


	public static parse(directiveName: string, expression: string): DirectiveExpressionType {
		const stream = TokenStream.getTokenStream(expression);
		const parser = new DirectiveExpressionParser(directiveName, stream);
		try {
			parser.scan();
		} catch (error) {
			console.error('error parsing template expression', expression, parser, error);
		}
		return parser.getDirectiveExpressionType();
	}

	protected templateExpressions = new Array<TokenExpression[]>();
	protected directiveInputs = new Map<string, string>();

	constructor(protected directiveName: string, protected stream: TokenStream) { }

	getDirectiveExpressionType(): DirectiveExpressionType {
		return {
			templateExpressions: this.templateExpressions,
			directiveInputs: this.directiveInputs
		};
	}
	scan(): void {
		// parse 'let/const/var' if found, or switch to expression mode.
		if (this.isDeclareKeyword()) {
			this.parseTemplateInput();
		} else {
			// parse expression, possible ends is semicolon, comma, let and 'EOS'
			this.parseExpression(this.directiveName);
		}
		if (this.stream.peek().isType(Token.EOS)) {
			return;
		}
		this.consumeSemicolonOrComma();

		// parse let and parseDirectiveAndTemplateInputs
		while (this.stream.peek().isNotType(Token.EOS)) {
			this.parseTemplateInput() || this.parseDirectiveAndTemplateInputs();
			this.consumeSemicolonOrComma();
		}
	}
	protected consume(token: Token) {
		if (this.stream.next().isNotType(token)) {
			throw new Error(this.stream.createError(`Parsing ${JSON.stringify(token)}`));
		}
	}
	protected check(token: Token): boolean {
		const peek = this.stream.peek();
		if (peek.isType(token)) {
			this.stream.next();
			return true;
		}
		return false;
	}
	protected consumeToList(token: Token, list: TokenExpression[]) {
		const next = this.stream.next();
		if (next.isNotType(token)) {
			throw new Error(this.stream.createError(`Parsing ${JSON.stringify(token)}`));
		}
		list.push(next);
	}

	protected consumeIfToken(token: Token, list: TokenExpression[]): boolean {
		const next = this.stream.peek();
		if (next.isNotType(token)) {
			return false;
		}
		list.push(next);
		this.stream.next();
		return true;
	}

	protected isDeclareKeyword(): boolean {
		const peek = this.stream.peek();
		return peek.isType(Token.LET) || peek.isType(Token.CONST) || peek.isType(Token.VAR);
	}

	protected isIdentifier(): boolean {
		return this.stream.peek().isType(Token.IDENTIFIER);
	}

	protected isAsKeyword(): boolean {
		const peek = this.stream.peek();
		return peek.isType(Token.IDENTIFIER) && (peek.getValue<Identifier>().getName() == 'as');
	}

	protected consumeAsKeyword() {
		this.consume(Token.IDENTIFIER);
	}
	protected isSemicolon() {
		return this.stream.peek().isType(Token.SEMICOLON);
	}
	protected isComma() {
		return this.stream.peek().isType(Token.COMMA);
	}
	protected consumeSemicolonOrComma() {
		let peek = this.stream.peek();
		if (peek.isType(Token.SEMICOLON) || peek.isType(Token.COMMA)) {
			this.stream.next();
			return;
		}
	}
	protected parseTemplateInput() {
		// let = "let" :local "=" :export ";"?
		if (this.isDeclareKeyword()) {
			let peek = this.stream.peek();
			const list: TokenExpression[] = [peek];
			this.consume(peek.token);
			peek = this.stream.peek();
			if (Token.isOpenPair(peek.token) && peek.isNotType(Token.LPAREN)) {
				// object and array pattern, destructing
				this.stream.readTill(Token.closeOf(peek.token), list);
			} else if (peek.isType(Token.IDENTIFIER)) {
				this.consumeToList(Token.IDENTIFIER, list);
			} else {
				throw new Error(this.stream.createError(`Can't parse let/const/var {IDENTIFIER/ObjectPattern}`));
			}
			if (this.consumeIfToken(Token.ASSIGN, list)) {
				this.stream.readTokensConsiderPair(list, Token.SEMICOLON, Token.COMMA, Token.LET, Token.CONST, Token.VAR, Token.EOS);
			} else {
				list.push(TokenConstant.ASSIGN, TokenConstant.IMPLICIT);
			}
			this.templateExpressions.push(list);
			return true;
		}
		return false;
	}

	protected parseExpression(inputName: string) {
		const list: TokenExpression[] = [];
		this.stream.readTokensConsiderPair(list, Token.SEMICOLON, Token.COMMA, Token.LET, Token.EOS);
		this.directiveInputs.set(inputName, list.map(this.mapTokenToString).join(' '));
	}

	/**
	 * check if the first is
	 * @returns `boolean`
	 */
	protected parseDirectiveAndTemplateInputs() {
		if (this.stream.peek().isType(Token.EOS)) {
			return;
		}
		let inputToken: TokenExpression;
		if (this.isIdentifier()) {
			inputToken = this.stream.next();
		} else {
			inputToken = this.stream.next();
			const identifierName = inputToken.token.getName();
			inputToken = new TokenExpression(Token.IDENTIFIER, [-1, -1], new Identifier(identifierName));
		}

		// only template input
		// mapping from directive scope(context) to template scope
		if (this.isAsKeyword()) {
			// as = :export "as" :local ";"?
			this.consumeAsKeyword();
			// rewrite `input as alias`
			// ==> in template -> alias = input

			const aliasToken = this.stream.next();
			const aliasList: TokenExpression[] = [];
			aliasList.push(aliasToken, TokenConstant.ASSIGN, inputToken, TokenConstant.EOS);
			this.templateExpressions.push(aliasList);
			return;
		}

		this.check(Token.ASSIGN) || this.check(Token.COLON);

		const list: TokenExpression[] = [];
		// keyExp = :key ":"? :expression ("as" :local)? ";"?
		this.stream.readTokensConsiderPair(list, Token.SEMICOLON, Token.COMMA, Token.LET, Token.CONST, Token.VAR, Token.EOS);

		// mix for directive input and template input
		if (this.isAsKeyword()) {
			this.consumeAsKeyword();
			// rewrite `input {x: 7, y: 9} as alias` 
			// ==> in directive ->`input = {x: 7, y: 9}`
			// ==> or in template -> let alias = input
			const aliasToken = this.stream.next();
			const aliasList: TokenExpression[] = [];
			aliasList.push(TokenConstant.LET, aliasToken, TokenConstant.ASSIGN, inputToken, TokenConstant.EOS);
			this.templateExpressions.push(aliasList);
		}
		const inputName = inputToken.getValue<Identifier>().getName() as string;
		this.directiveInputs.set(inputName, list.map(this.mapTokenToString).join(' '));

	}

	private mapTokenToString(token: TokenExpression): String {
		if (token.value) {
			return token.value.toString();
		}
		return token.token.getName();
	}

}

