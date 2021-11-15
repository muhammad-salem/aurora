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
		if (expression === 'let user of people') {
			debugger;
		}
		const stream = TokenStream.getTokenStream(expression);
		const parser = new DirectiveExpressionParser(stream);
		try {
			console.log(expression);
			const inputs = parser.scan();
			console.log(inputs);

			// stream.reset();
			// const ast = JavaScriptParser.parse(stream);
			// console.log(ast);

		} catch (error) {
			console.error(expression, error);
		}
	}

	protected templateExpressions = new Array<ExpressionNode>();
	protected directiveInputs = new Map<string, ExpressionNode>();

	constructor(protected stream: TokenStream) { }

	scan() {
		while (this.stream.peek().isNotType(Token.EOS)) {
			this.parseTemplateInput() || this.parseDirectiveAndTemplateInputs();
		}
		return {
			templateExpressions: this.templateExpressions,
			directiveInputs: this.directiveInputs
		};
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

	protected isLet(): boolean {
		return this.stream.peek().isType(Token.LET);
	}

	protected isIdentifier(): boolean {
		return this.stream.peek().isType(Token.IDENTIFIER);
	}

	protected isAsKeyword(): boolean {
		const peek = this.stream.peek();
		return peek.isType(Token.IDENTIFIER) && (peek.getValue<Identifier>().getName() == 'as');
	}

	protected isSemicolon() {
		return this.stream.peek().isType(Token.SEMICOLON);
	}
	protected parseTemplateInput() {
		if (this.isLet()) {
			const list: TokenExpression[] = [];
			this.consumeToList(Token.LET, list);
			const peek = this.stream.peek();
			if (Token.isOpenPair(peek.token) && peek.isNotType(Token.L_PARENTHESES)) {
				this.stream.readTill(Token.closeOf(peek.token), list);
			} else if (peek.isType(Token.IDENTIFIER)) {
				this.consumeToList(Token.IDENTIFIER, list);
			} else {
				throw new Error(this.stream.createError(`Can't parse let {IDENTIFIER/ObjectPattern}`));
			}
			if (this.check(Token.ASSIGN)) {
				this.consumeToList(Token.ASSIGN, list);
				this.parseRSideExpression(list, true);
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


	private parseRSideExpression(list: TokenExpression[], pipelineEnabled = false) {
		debugger;
		let peek = this.stream.peek();
		if (Token.isOpenPair(peek.token)) {
			const patternStream = this.stream.getStreamer(Token.closeOf(peek.token));
			list.push(...patternStream.toTokens());
		} else if (peek.isType(Token.IDENTIFIER)) {
			this.consumeToList(Token.IDENTIFIER, list);
			peek = this.stream.peek();
			while (Token.isPropertyOrCall(peek.token)) {
				if (peek.isType(Token.L_BRACKETS)) {
					// computed members
					this.stream.readTill(Token.R_BRACKETS, list);
				} else if (peek.isType(Token.L_PARENTHESES)) {
					// call
					this.stream.readTill(Token.R_PARENTHESES, list);
				} else if (peek.isType(Token.PERIOD)) {
					// dot notation
					this.consumeToList(Token.PERIOD, list);
					this.consumeToList(Token.IDENTIFIER, list);
				} else if (peek.isType(Token.QUESTION_PERIOD)) {
					// optional 
					this.consumeToList(Token.PERIOD, list);
					peek = this.stream.peek();
					if (Token.isPropertyOrCall(peek.token) && peek.isNotType(Token.PERIOD)) continue;
					this.consumeToList(Token.IDENTIFIER, list);
				}
				peek = this.stream.peek();
			}
			// support pipeline
			if (peek.isType(Token.PIPELINE)) {
				if (!pipelineEnabled) {
					throw new Error(this.stream.createError(`Pipeline not supported at this location`));
				}
				// stop at semicolon or comma or end of stream
				this.stream.readTokensConsiderPair(list, Token.SEMICOLON, Token.COMMA, Token.EOS);
			}
		} else {
			throw new Error(this.stream.createError(`Can't parse {identifier/member/Object} expression`));
		}
		return peek;
	}

	protected parseExpression() {

	}
	/**
	 * check if the first is
	 * @returns `boolean`
	 */
	protected parseDirectiveAndTemplateInputs() {
		if (this.isIdentifier()) {
			const list: TokenExpression[] = [];
			const inputToken = this.stream.next();
			// only template input
			// mapping from directive scope(context) to template scope
			if (this.isAsKeyword()) {
				this.consume(Token.IDENTIFIER);
				// rewrite `input as alias`
				// ==> in template -> let alias = input

				const aliasToken = this.stream.next();
				const aliasList: TokenExpression[] = [];
				aliasList.push(TokenConstant.LET, aliasToken, TokenConstant.ASSIGN, inputToken, TokenConstant.EOS);
				const node = JavaScriptParser.parse(aliasList);
				this.templateExpressions.push(node);

				return true;
			}

			list.push(inputToken, TokenConstant.ASSIGN);
			this.parseRSideExpression(list);
			list.push(TokenConstant.EOS);

			// mix for directive input and template input
			if (this.isAsKeyword()) {
				this.consume(Token.IDENTIFIER);
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

