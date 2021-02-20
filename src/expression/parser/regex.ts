import { OperatorPrecedence, StatementPrecedence } from './grammar.js';
import { Token, TokenType } from './token.js';

export function escapeForRegex(str: string): string {
	return String(str).replace(/[.*+?^=!:${}()|[\]\/\\]/g, '\\$&');
}

const NULL = String(null);
const TRUE = String(true);
const FALSE = String(false);
const UNDEFINED = String(undefined);

export class RegexParser {

	private static sharedParser = new RegexParser();

	static parse(expr: string) {
		return RegexParser.sharedParser.parse(expr);
	}

	tokenParser = this.generateTokenParser(OperatorPrecedence, StatementPrecedence);



	private generateTokenParser(operators: string[][], statement: string[][]): RegExp {


		//dynamically build js parsing regex:
		const pattern = [
			// numbers,                         index 0
			/\d+(?:\.\d*)?|\.\d+/.source,

			// string-literal                   index 1
			/["](?:\\[\s\S]|[^"])+["]|['](?:\\[\s\S]|[^'])+[']/.source,

			// booleans                         index 2
			'true|false',

			// primitive values                 index 3
			'null|undefined',

			// parentheses                      index 4
			/\(|\)/.source,

			// brackets                         index 5
			/\[|\]/.source,

			// curly brackets                   index 6
			'{|}',

			// comma, semicolon                 index 7
			',|;',

			// operators                        index 8
			operators
				.flatMap(item => item)
				.filter((value: string, index: number, array: string[]) => {
					return array.indexOf(value) === index;
				})
				.sort((a, b) => b.length - a.length) //so that ">=" is added before "=" and ">"
				.map(escapeForRegex)
				.join('|'),

			// statement                        index 9
			statement
				.flatMap(item => item)
				.filter((value: string, index: number, array: string[]) => {
					return array.indexOf(value) === index;
				})
				.map(escapeForRegex)
				.join('|'),

			// properties                        index 10
			// has to be after the operators
			/[a-zA-Z$_ɵ][a-zA-Z0-9$_]*/.source,

			// remaining (non-whitespace-)chars, just in case
			// has to be at the end              index 11
			/\S/.source
		].map(s => `(${s})`).join('|');

		return new RegExp(pattern, 'g');
	}

	private generateTokens(expression: string): Token[] {

		const tokens: Token[] = [];
		let lastTokenIndex = -1;

		expression.replace(this.tokenParser, (substring: string, ...args: any[]): string => {

			let token: Token;

			const [
				number,                 /** index 0  */
				string,                 /** index 1  */
				boolean,                /** index 2  */
				nullish,                /** index 3  */
				parentheses,            /** index 4  */
				brackets,               /** index 5  */
				curly,                  /** index 6  */
				commaAndSemicolon,      /** index 7  */
				operator,               /** index 8  */
				statement,              /** index 9  */
				property,               /** index 10 */
				,             /** index 11 */
			] = args;

			// console.log(args);
			if (number) {
				token = new Token(TokenType.NUMBER, number);
			} else if (string) {
				token = new Token(TokenType.STRING, string);
			} else if (boolean) {
				if (TRUE === boolean) {
					token = new Token(TokenType.BOOLEAN, TRUE);
				} else {
					token = new Token(TokenType.BOOLEAN, FALSE);
				}
			} else if (nullish) {
				if (NULL === nullish) {
					token = new Token(TokenType.NULLISH, NULL);
				} else {
					token = new Token(TokenType.NULLISH, UNDEFINED);
				}
			} else if (parentheses) {
				token = new Token(parentheses === '(' ? TokenType.OPEN_PARENTHESES : TokenType.CLOSE_PARENTHESES, parentheses);
			} else if (brackets) {
				token = new Token(brackets === '[' ? TokenType.OPEN_BRACKETS : TokenType.CLOSE_BRACKETS, brackets);
			} else if (curly) {
				token = new Token(curly === '{' ? TokenType.OPEN_CURLY : TokenType.CLOSE_CURLY, curly);
			} else if (commaAndSemicolon) {
				token = new Token(commaAndSemicolon === ',' ? TokenType.COMMA : TokenType.SEMICOLON, commaAndSemicolon);
			} else if (operator) {
				token = new Token(TokenType.OPERATOR, operator);
			} else if (statement) {
				token = new Token(TokenType.STATEMENTS, statement);
			} else if (property) {
				// check for bigint
				if (property === 'n') {
					if (lastTokenIndex >= 0 && tokens[lastTokenIndex].type === TokenType.NUMBER) {
						tokens[lastTokenIndex].type = TokenType.BIGINT;
						return substring;
					}
				}
				token = new Token(TokenType.PROPERTY, property);
			} else {
				token = new Token(TokenType.NS, TokenType.NS.toString());
				// throw new Error(`unexpected token '${substring}'`);
			}
			tokens.push(token);
			lastTokenIndex++;
			return substring;
		});
		tokens.push(new Token(TokenType.EOF, TokenType.EOF.toString()));
		return tokens;
	}


	parse(expression: string) {

		const tokens = this.generateTokens(expression);
		// var instr: Instruction[] = [];
		// var parserState = new ParserState(this, new TokenStream(this, expression));

		// parserState.parseExpression(instr);
		// parserState.expect(TokenType.EOF, 'EOF');

		return tokens;
	}

}
