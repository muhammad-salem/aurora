import type { ExpressionNode, NodeExpressionClass } from '../api/expression.js';
import { ComputedMemberAccessNode, MemberAccessNode } from '../api/definition/member.js';
import { ArithmeticNode, PostfixNode, PrefixNode } from '../api/operators/arithmetic.js';
import { AssignmentNode } from '../api/operators/assignment.js';
import { OptionalChainingNode } from '../api/operators/chaining.js';
import { EqualityNode } from '../api/operators/equality.js';
import { GroupingNode } from '../api/operators/grouping.js';
import { LogicalAssignmentNode, LogicalNode } from '../api/operators/logical.js';
import { RelationalNode, ThreeWayComparisonNode } from '../api/operators/relational.js';
import { BinaryBitwiseNode, BitwiseShiftNode } from '../api/operators/shift.js';
import { TokenStream } from './stream.js';
import { Token, TokenType } from './token.js';
import { ScopeProvider } from '../api/context/provider.js';
import { TernaryNode } from '../api/operators/ternary.js';
import { PipelineNode } from '../api/operators/pipeline.js';
import { CommaNode } from '../api/operators/comma.js';
import { FunctionCallNode } from '../api/computing/function.js';
import { LiteralUnaryNode, UnaryNode } from '../api/operators/unary.js';
import { NewNode } from '../api/computing/new.js';
import { PropertyNode } from '../api/definition/values.js';
import { ConstNode, LetNode, Variable } from '../api/statement/declarations/declares.js';
import { ForAwaitOfNode, ForInNode, ForNode, ForOfNode } from '../api/statement/iterations/for.js';
import { BlockNode } from '../api/statement/controlflow/block.js';
import { DoWhileNode, WhileNode } from '../api/statement/iterations/while.js';

export class ParserUtils {
	constructor(protected tokens: Token[]) { }
	protected getExpressionValue(index: number) {
		return this.tokens[index].valueAsExpression();
	}
	protected getStringValue(index: number) {
		return this.tokens[index].valueAsString();
	}
	protected includes(tokens: Token[], expect: TokenType, start = 0): number {
		for (let index = start; index < tokens.length; index++) {
			const token = tokens[index];
			if (token.type === expect) {
				return index;
			}
			else if (token.type === TokenType.EOF) {
				return -1;
			}
		}
		return -1;
	}
	protected indexOf(expect: TokenType, start = 0): number {
		if (start >= this.tokens.length) {
			return -1;
		}
		if (TokenType.isClosePair(expect)) {
			return this.getPairTokenIndex(TokenType.openOf(expect), expect, start);
		}
		return this.getTokenIndex(expect, start);
	}
	private getTokenIndex(expect: TokenType, start: number): number {
		return this.includes(this.tokens, expect, start);
	}

	private getPairTokenIndex(open: TokenType, expectClose: TokenType, start: number): number {
		// check pair
		let count = 0;
		for (let index = start; index < this.tokens.length; index++) {
			const token = this.tokens[index];
			if (token.type === open) {
				count++;
			}
			else if (token.type === expectClose) {
				if (count === 0) {
					return index;
				}
				else if (count > 0) {
					count--;
				}
			}
			else if (token.type === TokenType.EOF) {
				return -1;
			}

		}
		return -1;
	}

}

/**
 * operator parser
 */
export class OperatorParser extends ParserUtils {
	static parse(tokens: Token[]) {
		const parser = new OperatorParser(tokens);
		parser.scan();
		return parser.tokens;
	}
	constructor(tokens: Token[]) {
		super(tokens);
	}
	getExpressionValue(index: number) {
		return this.tokens[index].valueAsExpression();
	}
	/**
	 * Operator precedence
	 * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Operator_Precedence#table
	 */
	scan(): void {
		this.parseGrouping();
		this.parseMemberAccess();
		this.parseComputedMemberAccess();
		this.parseNewOperator();
		this.parseFunctionCall();
		this.parseOptionalChaining();

		this.parsePrefixPostfixIncrementDecrement();
		this.parseUnary();
		this.parseLiteralUnary();

		// Exponentiation (**)	right-to-left	… ** …
		this.parseInfixNodeType(ArithmeticNode);
		this.parseArithmeticUnary();

		this.parseInfixNodeType(BitwiseShiftNode);
		this.parseInfixNodeType(ThreeWayComparisonNode);
		this.parseInfixNodeType(RelationalNode);
		this.parseInfixNodeType(EqualityNode);

		this.parseInfixNodeType(BinaryBitwiseNode);
		this.parseInfixNodeType(LogicalNode);

		this.parsePipeline();
		this.parseTernary();


		this.parseInfixNodeType(AssignmentNode);
		this.parseInfixNodeType(LogicalAssignmentNode);

		// this.parseYield();
		// this.parseYieldAstr();
		this.parseCommaSequence();
	}
	parseGrouping(): void {
		for (let index = this.tokens.length - 2; index >= 0; index--) {
			if (this.tokens[index].isTypeOf(TokenType.OPEN_PARENTHESES)) {
				const start = index;
				const close = this.indexOf(TokenType.CLOSE_PARENTHESES, start + 1);
				if (close === -1) {
					throw new Error(`error parsing group at index: ${index}, no ')' found`);
				}
				const groupTokens = this.tokens.slice(start + 1, close);
				OperatorParser.parse(groupTokens);
				if (this.tokens[index - 1].isTypeOf(TokenType.STATEMENT)) {
					this.tokens.splice(start + 1, close - start - 1, ...groupTokens);
					continue;
				}
				let expression: ExpressionNode;
				if (groupTokens.length === 1) {
					expression = groupTokens[0].valueAsExpression();
				} else if (groupTokens.length === 0) {
					expression = undefined as unknown as ExpressionNode;
				} else {
					throw new Error(`error parsing group at index: ${index}`);
				}
				const groupExpression = new Token(TokenType.EXPRESSION, new GroupingNode(expression));
				this.tokens.splice(start, close - start + 1, groupExpression);
			}
		}
	}
	parseMemberAccess(): void {
		for (let index = 1; index < this.tokens.length - 1; index++) {
			if (this.tokens[index].type === TokenType.OPERATOR && this.tokens[index].value === '.') {
				const member = new Token(
					TokenType.EXPRESSION,
					new MemberAccessNode(
						this.tokens[index - 1].value as ExpressionNode,
						this.tokens[index + 1].value as ExpressionNode
					)
				);
				this.tokens.splice(index - 1, 3, member);
				index--;
			}
		}
	}
	parseComputedMemberAccess(): void {
		let open: boolean;
		const stream = TokenStream.getTokenStream(this.tokens);
		while (open = stream.seekTo(TokenType.OPEN_BRACKETS)) {
			if (open && !stream.lastToken()?.isFunctionCall()) {
				const start = stream.getPos() - 2;
				const propertyName = stream.getStreamer(TokenType.CLOSE_BRACKETS);
				const end = stream.getPos();

				const tokens = OperatorParser.parse(propertyName.toTokens());
				const property = tokens[0].valueAsExpression();
				const propertyExpression = new Token(
					TokenType.EXPRESSION,
					new ComputedMemberAccessNode(this.getExpressionValue(start), property)
				);
				this.tokens.splice(start, end - start, propertyExpression);
				stream.setPos(start);
			}
		}
	}
	parseNewOperator() {
		for (let index = this.tokens.length - 2; index >= 0; index--) {
			if (this.tokens[index].type === TokenType.OPERATOR) {
				if (this.tokens[index].value === 'new') {
					let className: ExpressionNode;
					const start = index;
					let end: number;
					const classNameTokens: Token[] = [];
					for (end = start + 1; end < this.tokens.length; end++) {
						if (this.tokens[end].isEofSmCP() || this.tokens[end].value instanceof GroupingNode) {
							break;
						}
						classNameTokens.push(this.tokens[end]);
					}
					if (classNameTokens.length === 1 && classNameTokens[0].isPropOrExp()) {
						className = classNameTokens[0].valueAsExpression();
					} else {
						const classNameTkn = OperatorParser.parse(classNameTokens);
						className = classNameTkn[0].valueAsExpression();
					}
					if (this.tokens[end]?.type === TokenType.EXPRESSION && this.tokens[end].value instanceof GroupingNode) {
						const node = (this.tokens[end].value as GroupingNode).getNode();
						let params: ExpressionNode[] | undefined;
						if (node instanceof CommaNode) {
							params = node.getExpressions();
						} else if (node) {
							params = [node];
						}
						const newNode = new Token(TokenType.EXPRESSION, new NewNode(className, params));
						this.tokens.splice(start, end - start + 1, newNode);
					} else {
						// without arguments
						const newNode = new Token(TokenType.EXPRESSION, new NewNode(className));
						this.tokens.splice(start, end - start + 1, newNode);
					}
				}
			}
		}
	}
	parseFunctionCall() {
		for (let index = this.tokens.length - 1; index >= 0; index--) {
			if (index > 0 && this.tokens[index].value instanceof GroupingNode) {
				if (this.tokens[index - 1].isPropOrExp()) {
					const func = this.getExpressionValue(index - 1);
					const node = (this.getExpressionValue(index) as GroupingNode).getNode();
					let params: ExpressionNode[];
					if (node instanceof CommaNode) {
						params = node.getExpressions();
					} else if (node) {
						params = [node];
					} else {
						params = [];
					}
					const funcNode = new Token(TokenType.EXPRESSION, new FunctionCallNode(func, params));
					this.tokens.splice(index - 1, 2, funcNode);
					index--;
				}
			}
		}
	}
	parseOptionalChaining() {
		for (let index = 0; index < this.tokens.length; index++) {
			if (this.tokens[index].type === TokenType.OPERATOR && this.tokens[index].value === '?.') {
				let temp: Token;
				switch (this.tokens[index + 1].type) {
					case TokenType.OPEN_BRACKETS:
						// computed property access
						temp = new Token(
							TokenType.EXPRESSION,
							new OptionalChainingNode(
								this.getExpressionValue(index - 1),
								this.getExpressionValue(index + 2),
								'expression'
							)
						)
						this.tokens.splice(index - 1, 5, temp);
						break;
					case TokenType.EXPRESSION:
						// property access
						temp = new Token(
							TokenType.EXPRESSION,
							new OptionalChainingNode(
								this.getExpressionValue(index - 1),
								this.getExpressionValue(index + 1),
								'property'
							)
						)
						this.tokens.splice(index - 1, 3, temp);
						break;
					case TokenType.EXPRESSION:
						// function access
						if (this.tokens[index + 1].value instanceof FunctionCallNode) {
							temp = new Token(
								TokenType.EXPRESSION,
								new OptionalChainingNode(
									this.getExpressionValue(index - 1),
									this.getExpressionValue(index + 1),
									'function'
								)
							)
							this.tokens.splice(index - 1, 3, temp);
						}
						break;
				}
			}
		}
	}
	parsePrefixPostfixIncrementDecrement() {
		for (let index = this.tokens.length - 1; index > 0; index--) {
			if (this.tokens[index].type === TokenType.OPERATOR) {
				switch (this.tokens[index].value) {
					case '++':
					case '--':
						if (this.tokens[index - 1].isPropOrExp()) {
							// check of is postfix
							const postfix = new Token(TokenType.EXPRESSION,
								new PostfixNode(
									this.tokens[index].value as '++' | '--',
									this.getExpressionValue(index - 1)
								)
							);
							this.tokens.splice(index - 1, 2, postfix);
						}
						else if (this.tokens[index + 1].isPropOrExp()) {
							// check of is prefix
							const prefix = new Token(TokenType.EXPRESSION,
								new PrefixNode(
									this.tokens[index].value as '++' | '--',
									this.getExpressionValue(index + 1)
								)
							);
							this.tokens.splice(index, 2, prefix);
						}
						break;
					default:
				}
			}

		}
	}
	parseUnary() {
		for (let index = this.tokens.length - 2; index >= 0; index--) {
			if (this.tokens[index].type === TokenType.OPERATOR) {
				switch (this.tokens[index].value) {
					case '!':
					case '~':
						const unary = new Token(TokenType.EXPRESSION,
							new UnaryNode(
								this.tokens[index].value as string,
								this.getExpressionValue(index + 1)
							)
						);
						this.tokens.splice(index, 2, unary);
						break;
					default:
				}
			}

		}
	}
	parseArithmeticUnary() {
		for (let index = this.tokens.length - 2; index >= 0; index--) {
			if (this.tokens[index].type === TokenType.OPERATOR) {
				switch (this.tokens[index].value) {
					case '+':
					case '-':
						if (this.tokens[index + 1].isPropOrExp()) {
							// check of is prefix
							if ((this.tokens[index + 1].index! - this.tokens[index].index!) === 1) {
								const literalUnary = new Token(TokenType.EXPRESSION,
									new UnaryNode(
										this.tokens[index].value as string,
										this.getExpressionValue(index + 1)
									)
								);
								this.tokens.splice(index, 2, literalUnary);
							}
						}
						break;
					default:
				}
			}

		}
	}
	parseLiteralUnary() {
		for (let index = this.tokens.length - 2; index >= 0; index--) {
			if (this.tokens[index].type === TokenType.OPERATOR) {
				switch (this.tokens[index].value) {
					case 'typeof':
					case 'void':
					case 'delete':
					case 'await':
						const literalUnary = new Token(TokenType.EXPRESSION,
							new LiteralUnaryNode(
								this.tokens[index].value as string,
								this.getExpressionValue(index + 1)
							)
						);
						this.tokens.splice(index, 2, literalUnary);
						break;
					default:
				}
			}

		}
	}
	parsePipeline() {
		for (let index = 0; index < this.tokens.length; index++) {
			if (this.tokens[index].type === TokenType.OPERATOR) {
				if ('|>' === this.tokens[index].value) {
					const param = this.tokens[index - 1].value as ExpressionNode;
					const func = this.tokens[index + 1].value as ExpressionNode;
					if (this.tokens[index + 2]?.value === ':'
						|| this.tokens[index + 2]?.type === TokenType.OPEN_PARENTHESES) {
						const args: ExpressionNode[] = [];
						let paramterIndex = 0;
						let pointer = index + 3;
						for (; pointer < this.tokens.length; pointer++) {
							if (!this.tokens[pointer] || this.tokens[pointer].isEofSmCP()) {
								break;
							}
							if (this.tokens[pointer].value === '?') {
								paramterIndex = args.length;
								continue;
							} else if (
								this.tokens[pointer].value === ':'
								|| this.tokens[pointer]?.type === TokenType.COMMA) {
								continue;
							}
							args.push(this.getExpressionValue(pointer));
						}
						const ternary = new Token(TokenType.EXPRESSION, new PipelineNode(param, func, args, paramterIndex));
						this.tokens.splice(index - 1, pointer - index, ternary);
						index -= 2;
					} else {
						const ternary = new Token(TokenType.EXPRESSION, new PipelineNode(param, func));
						this.tokens.splice(index - 1, 3, ternary);
						index -= 2;
					}
				}
			}
		}
	}
	parseTernary() {
		for (let index = 0; index < this.tokens.length; index++) {
			if (this.tokens[index].type === TokenType.OPERATOR) {
				if ('?' === this.tokens[index].value) {
					const logical = this.getExpressionValue(index - 1);
					const ifTrue = this.getExpressionValue(index + 1);
					if (this.tokens[index + 2].value !== ':') {
						throw new Error(`not ternary operator`);
					}
					const ifFalse = this.getExpressionValue(index + 3);
					const ternary = new Token(
						TokenType.EXPRESSION,
						new TernaryNode(logical, ifTrue, ifFalse)
					);
					this.tokens.splice(index - 1, 5, ternary);
					index -= 2;
				}
			}
		}
	}
	// parseYield(){}
	// parseYieldAstr(){}
	parseCommaSequence() {
		for (let index = 0; index < this.tokens.length; index++) {
			if (this.tokens[index].type === TokenType.COMMA) {
				const expressions: ExpressionNode[] = [];
				const start = index - 1;
				expressions.push(this.tokens[start].value as ExpressionNode);
				for (++index; index < this.tokens.length; index++) {
					if (this.tokens[index].type === TokenType.COMMA) {
						continue;
					}
					if (this.tokens[index].type === TokenType.SEMICOLON ||
						this.tokens[index].type === TokenType.EOF) {
						break;
					}
					expressions.push(this.getExpressionValue(index));
				}
				const ternary = new Token(TokenType.EXPRESSION, new CommaNode(expressions));
				this.tokens.splice(start, (expressions.length * 2) - 1, ternary);
				index = start;
			}
		}
	}
	private parseInfixNodeType(nodeType: NodeExpressionClass<ExpressionNode>): void {
		for (let index = 1; index < this.tokens.length - 1; index++) {
			if (this.tokens[index].type === TokenType.OPERATOR) {
				if (nodeType.KEYWORDS!.includes(this.tokens[index].value as string) &&
					this.tokens[index - 1].isPropOrExp() &&
					this.tokens[index + 1].isPropOrExp()) {
					const temp = new Token(
						TokenType.EXPRESSION,
						new nodeType(
							this.tokens[index].value as string,
							this.getExpressionValue(index - 1),
							this.getExpressionValue(index + 1)
						)
					);
					this.tokens.splice(index - 1, 3, temp);
					index--;
				}
			}
		}
	}
}

export class StatementParser extends ParserUtils {
	static parse(tokens: Token[]) {
		const parser = new StatementParser(tokens);
		parser.scan();
		return parser.tokens;
	}
	private static Declarations = ['let', 'const', 'var'];
	constructor(tokens: Token[]) {
		super(tokens);
	}
	scan() {
		// this.parseConstAndLet();
		this.parseDeclarations();
		this.parseObjectAndBlock();
		this.parseForLoop();
		this.parseDoWhile();
		this.parseWhile();
	}
	private createVariable(node: ExpressionNode) {
		if (node instanceof AssignmentNode) {
			return new Variable(node.getLeft(), node.getRight());
		} else if (node instanceof PropertyNode) {
			return new Variable(node);
		} else {
			throw new Error(`unknown type of definition`);
		}
	}
	private createDeclareNode(keyword: string, variables: Variable[]) {
		if (keyword === 'const') {
			return new ConstNode(variables);
		}
		return new LetNode(variables);
	}
	private parseDeclarations() {
		for (let index = this.tokens.length - 2; index >= 0; index--) {
			if (this.tokens[index].type === TokenType.STATEMENT) {
				if (StatementParser.Declarations.includes(this.getStringValue(index))) {
					const keyword = this.getStringValue(index);
					const node = this.getExpressionValue(index + 1);
					let variables: Variable[];
					if (node instanceof CommaNode) {
						const temp = node.getExpressions();
						variables = temp.map(this.createVariable);
					} else {
						variables = [this.createVariable(node)];
					}
					const declarationsNode = this.createDeclareNode(keyword, variables);
					const declareExpression = new Token(TokenType.EXPRESSION, declarationsNode);
					this.tokens.splice(index, 2, declareExpression);
				}
			}
		}
	}
	private parseObjectAndBlock() {
		for (let index = this.tokens.length - 2; index >= 0; index--) {
			if (this.tokens[index].isTypeOf(TokenType.OPEN_CURLY) &&
				(this.tokens[index - 1].isTypeOf(TokenType.CLOSE_PARENTHESES) ||
					this.tokens[index - 1].isTypeOf(TokenType.STATEMENT))) {
				// parse block
				const i = this.indexOf(TokenType.CLOSE_CURLY, index + 1);
				let node: ExpressionNode;
				if (i - index === 2) {
					// one statement
					node = new BlockNode([this.tokens[index + 1].valueAsExpression()]);
				} else {
					// list of statements
					const tokens = this.tokens.slice(index + 1, i);
					OperatorParser.parse(tokens);
					StatementParser.parse(tokens);
					const statements = tokens
						.filter(tkn => !tkn.isEqual(TokenType.SEMICOLON, ';'))
						.map(tkn => tkn.valueAsExpression());
					node = new BlockNode(statements);
				}
				const block = new Token(TokenType.EXPRESSION, node);
				this.tokens.splice(index, i - index + 1, block);
			} else {
				// parse object

			}
		}
	}

	/**
	 * - for ([initialization]; [condition]; [final-expression])
	 * 		statement
	 * - for (variable in object)
	 * 		statement
	 * - for (variable of iterable) {
	 * 		statement
	 * 	 }
	 * - for await (variable of iterable) {
	 * 		statement
	 * 	 }
	 */
	private parseForLoop() {
		for (let index = this.tokens.length - 2; index >= 0; index--) {
			if (this.tokens[index].isEqual(TokenType.STATEMENT, 'for')) {
				let type: 'SEMICOLON' | 'IN' | 'OF' | 'AWAIT';
				let end = index + 2;
				if (this.tokens[end].type === TokenType.STATEMENT &&
					this.getStringValue(end) === 'await') {
					type = 'AWAIT';
					end = index + 3;
				}
				const tempParams: (ExpressionNode | undefined)[] = [];
				let temp: ExpressionNode | undefined = undefined;
				for (; end < this.tokens.length; end++) {
					if (this.tokens[end].type === TokenType.CLOSE_PARENTHESES) {
						tempParams.push(temp);
						temp = undefined;
						break;
					} else if (this.tokens[end].isEqual(TokenType.STATEMENT, 'of')) {
						type ||= 'OF';
						tempParams.push(temp);
						temp = undefined;
					} else if (this.tokens[end].isEqual(TokenType.STATEMENT, 'in')) {
						type ||= 'IN';
						tempParams.push(temp);
						temp = undefined;
					} else if (this.tokens[end].isEqual(TokenType.SEMICOLON, ';')) {
						type ||= 'SEMICOLON';
						tempParams.push(temp);
						temp = undefined;
					} else {
						temp = this.tokens[end].valueAsExpression();
					}
				}
				end++;
				const statement = this.tokens[end].valueAsExpression();
				let node: ExpressionNode;
				switch (type!) {
					case 'SEMICOLON':
						node = new ForNode(statement, tempParams[0], tempParams[1], tempParams[3]);
						break;
					case 'IN':
						node = new ForInNode(tempParams[0]!, tempParams[1]!, statement);
						break;
					case 'OF':
						node = new ForOfNode(tempParams[0]!, tempParams[1]!, statement);
						break;
					case 'AWAIT':
						node = new ForAwaitOfNode(tempParams[0]!, tempParams[1]!, statement);
						break;
					default:
						break;
				}
				if (node!) {
					const declareExpression = new Token(TokenType.EXPRESSION, node);
					this.tokens.splice(index, end - index, declareExpression);
				}
			}

		}
	}
	private parseDoWhile() {
		for (let index = this.tokens.length - 2; index >= 0; index--) {
			if (this.tokens[index].isEqual(TokenType.STATEMENT, 'do')) {
				const statement = this.getExpressionValue(index + 1);
				if (!this.tokens[index + 2].isEqual(TokenType.STATEMENT, 'while')) {
					throw new Error(`Can't found 'while' in while statement at index: ${this.tokens[index + 2].index}`);
				}
				const openParentheses = index + 3;
				if (!this.tokens[openParentheses].isTypeOf(TokenType.OPEN_PARENTHESES)) {
					throw new Error(`Can't found '(' in while statement at index: ${this.tokens[openParentheses].index}`);
				}
				const closeParentheses = this.indexOf(TokenType.CLOSE_PARENTHESES, openParentheses + 1);
				if (closeParentheses === -1) {
					throw new Error(`Can't found ')' in while statement after index: ${this.tokens[openParentheses].index}`);
				}
				const conditionTokens = this.tokens.slice(openParentheses + 1, closeParentheses);
				if (conditionTokens.length !== 1) {
					OperatorParser.parse(conditionTokens);
					StatementParser.parse(conditionTokens);
				}
				const condition = conditionTokens[0].valueAsExpression();
				const doWhile = new DoWhileNode(condition, statement);
				const expression = new Token(TokenType.EXPRESSION, doWhile);
				this.tokens.splice(index, closeParentheses - index + 1, expression);
			}
		}
	}
	private parseWhile() {
		for (let index = this.tokens.length - 2; index >= 0; index--) {
			if (this.tokens[index].isEqual(TokenType.STATEMENT, 'while')) {
				const openParentheses = index + 1;
				if (!this.tokens[openParentheses].isTypeOf(TokenType.OPEN_PARENTHESES)) {
					throw new Error(`Can't found '(' in while statement at index: ${this.tokens[openParentheses].index}`);
				}
				const closeParentheses = this.indexOf(TokenType.CLOSE_PARENTHESES, openParentheses + 1);
				if (closeParentheses === -1) {
					throw new Error(`Can't found ')' in while statement after index: ${this.tokens[openParentheses].index}`);
				}
				const conditionTokens = this.tokens.slice(openParentheses + 1, closeParentheses);
				if (conditionTokens.length !== 1) {
					OperatorParser.parse(conditionTokens);
					StatementParser.parse(conditionTokens);
				}
				const condition = conditionTokens[0].valueAsExpression();
				const statement = this.getExpressionValue(closeParentheses + 1);
				const whileNode = new WhileNode(condition, statement);
				const expression = new Token(TokenType.EXPRESSION, whileNode);
				this.tokens.splice(index, closeParentheses - index + 2, expression);
			}
		}
	}
}

export class Parser {
	parse(expression: string) {
		const stream: TokenStream = TokenStream.getTokenStream(expression);
		const tokens: Token[] = stream.toTokens();
		tokens.forEach(t => console.log(t));
		OperatorParser.parse(tokens);
		StatementParser.parse(tokens);
		return tokens;
	}
}

try {
	const parser = new Parser();
	let statement: string;
	// statement = `x.y?.zp[4]`;
	// statement = `9 + ( 2 * 3 - (5+6) + (4 / 8))`;
	// statement = `for (let index = 0; index < array.length; index++) {const element = array[index];}`;
	// statement = `const iterator of object; index as id; even as isEven;`;
	// statement = `switch (key) {case 'a': console.log('value'); break; default: break;}`;
	// statement = `y = true ? 6 : 7`;

	// statement = `((x.y.z[4]['abc']))`;
	// statement = `x?.y.z.r = y + d`;
	// statement = `x.y > 8 ? (a = b + c): (a = b + (9 |> Math.trunc))`;
	// statement = `x |> max:6:7:?:55`;
	// statement = `x |> max(6, 7, ?, 55)`;
	// statement = `x.y = 6, v.g = 9, df.gh = -44`;
	// statement = `delete x.y.v`;
	// statement = `x.y.d?.dd(3,4)`;
	// statement = `x + ++t +y`;
	// statement = `+y`;
	// statement = `new x(y,u,6,4, '5555')`;
	// statement = `new className(x, u(x?(y = 89):u??g), t||v)`;
	// statement = `let x = 8, u = 0, y,o`;
	// statement = `let x = 8; const u = 0`;
	// statement = `for (let i = 0; i< 10; i++) { console.log(i); }`;
	statement = `do {x = a+b;} while (x > 8);`
	// statement = `while(x > 9) { console.log(x++); }`;

	console.log(statement);
	const tokensJS = parser.parse(statement);
	const stack = ScopeProvider.for({});
	Reflect.set(window, 'parser', parser.parse);
	Reflect.set(window, 'tokens', tokensJS);
	Reflect.set(window, 'stack', stack);
	Reflect.set(window, 'getTokenStream', TokenStream.getTokenStream);
	console.log(tokensJS.map(t => t.value));
} catch (error) {
	console.error(error);
}
