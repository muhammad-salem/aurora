import { AssignmentExpression, ExpressionNode, Identifier, JavaScriptParser, Token, TokenExpression, TokenStream } from '@ibyar/expressions';



class TokenConstant {
	static LET = new TokenExpression(Token.LET);
	static COMMA = new TokenExpression(Token.COMMA);
	static ASSIGN = new TokenExpression(Token.ASSIGN);
	static IMPLICIT = new TokenExpression(Token.IDENTIFIER, new Identifier('$implicit'));
	static EOS = new TokenExpression(Token.EOS);
}

export class DirectiveExpressionParser {


	public static parse(expression: string) {
		const stream = TokenStream.getTokenStream(expression);
		const parser = new DirectiveExpressionParser(stream);
		try {
			console.log(expression);
			parser.scan();

			stream.reset();
			const ast = JavaScriptParser.parse(stream);
			console.log(ast);

		} catch (error) {
			console.error(expression, error);
		}
	}

	protected templateExpressions = new Array<ExpressionNode>();
	protected directiveInputs = new Map<string, ExpressionNode>();

	constructor(protected stream: TokenStream) { }
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

	protected isLet(): boolean {
		return this.stream.peek().isType(Token.LET);
	}

	protected isIdentifier(): boolean {
		return this.stream.peek().isType(Token.IDENTIFIER);
	}

	protected isAsKeyword(): boolean {
		const peek = this.stream.peek();
		return peek.isType(Token.IDENTIFIER) && (peek.value as Identifier).getName() == 'as';
	}

	protected isSemicolon() {
		return this.stream.peek().isType(Token.SEMICOLON);
	}

	scan() {
		const list: TokenExpression[] = [];
		while (true) {
			const token = this.stream.next();
			list.push(token);
			if (token.isType(Token.EOS)) {
				break;
			}
		}
		console.log(list);
		console.log(list.map(t => t.value));
	}
	protected parseTemplateInput() {
		if (this.isLet()) {
			const list: TokenExpression[] = [];
			this.consumeToList(Token.LET, list);
			const peek = this.stream.peek();
			if (Token.isOpenPair(peek.token) && peek.isNotType(Token.L_PARENTHESES)) {
				const patternStream = this.stream.getStreamer(Token.closeOf(peek.token));
				list.push(...patternStream.toTokens());
			} else if (peek.isType(Token.IDENTIFIER)) {
				this.consumeToList(Token.IDENTIFIER, list);
			} else {
				throw new Error(this.stream.createError(`Can't parse let {IDENTIFIER/ObjectPattern}`));
			}
			if (this.check(Token.ASSIGN)) {
				this.consumeToList(Token.ASSIGN, list);
				this.parseRSideExpression(list);
			} else {
				list.push(TokenConstant.ASSIGN, TokenConstant.IMPLICIT);
			}
			list.push(TokenConstant.EOS);
			const node = JavaScriptParser.parse(list);
			this.templateExpressions.push(node);
			return true;
		}
		return false;
	}


	private parseRSideExpression(list: TokenExpression[]) {
		let peek = this.stream.peek();
		if (Token.isOpenPair(peek.token)) {
			const patternStream = this.stream.getStreamer(Token.closeOf(peek.token));
			list.push(...patternStream.toTokens());
		} else if (peek.isType(Token.IDENTIFIER)) {
			this.consumeToList(Token.IDENTIFIER, list);
			peek = this.stream.peek();
			while (peek.isNotType(Token.IDENTIFIER)) {
				if (peek.isType(Token.L_BRACKETS)) {
					// computed members
					const patternStream = this.stream.getStreamer(Token.R_BRACKETS);
					list.push(...patternStream.toTokens());
				} else if (peek.isType(Token.PERIOD)) {
					// dot notation
					this.consumeToList(Token.PERIOD, list);
					this.consumeToList(Token.IDENTIFIER, list);
				}
				peek = this.stream.peek();
			}
			// TODO: |> pipeline
		} else {
			throw new Error(this.stream.createError(`Can't parse {identifier/member/Object} expression`));
		}
		return peek;
	}

	protected parseExpression() {

	}

	protected parseDirectiveInput() {
		if (this.isIdentifier()) {
			const inputToken = this.stream.next();
			const list: TokenExpression[] = [];
			list.push(inputToken, TokenConstant.ASSIGN);
			this.parseRSideExpression(list);
			list.push(TokenConstant.EOS);
			// this.consumeToList(Token.IDENTIFIER, list);

			if (this.isAsKeyword()) {
				// rewrite `input {x: 7, y: 9} as alias` 
				// ==> in directive ->`input = {x: 7, y: 9}`
				// ==> or in template -> let alias = input
				const aliasToken = this.stream.next();
				const aliasList: TokenExpression[] = [];
				aliasList.push(TokenConstant.LET, aliasToken, TokenConstant.ASSIGN, inputToken, TokenConstant.EOS);
				const node = JavaScriptParser.parse(aliasList);
				this.templateExpressions.push(node);
			}
			const node = JavaScriptParser.parse(list) as AssignmentExpression;
			const inputName = inputToken.getValue<Identifier>().getName() as string;
			this.directiveInputs.set(inputName, node.getRight());
			return true;
		}
		return false;
	}

}

