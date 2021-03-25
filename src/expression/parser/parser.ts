import type { ExpressionNode, NodeExpressionClass } from '../api/expression.js';
import { ComputedMemberAccessNode, MemberAccessNode } from '../api/definition/member.js';
import { ArithmeticNode } from '../api/operators/arithmetic.js';
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

// export class CountCoordinate {
// 	constructor(public start: number, public end: number) { }

// 	get length(): number {
// 		return this.end - this.start + 1;
// 	}
// }

// export class Counter {
// 	private open = 0;
// 	private openPos: number[] = [];
// 	private falseOpen = 0;
// 	private close = 0;
// 	private closePos: number[] = [];
// 	incrementOpened(pos: number) {
// 		this.open++;
// 		this.openPos.push(pos);
// 	}
// 	incrementClosed(pos: number) {
// 		this.close++;
// 		this.closePos.push(pos);
// 	}
// 	incrementFalseOpen() {
// 		this.falseOpen++;
// 	}
// 	decrementFalseOpen() {
// 		this.falseOpen--;
// 	}

// 	hasFalseOpen(): boolean {
// 		return this.falseOpen > 0;
// 	}

// 	isEqual() {
// 		return this.open === this.close;
// 	}

// 	isMulti() {
// 		return this.open > 1;
// 	}

// 	get length(): number {
// 		return this.closePos.length;
// 	}

// 	coordinate(): CountCoordinate[] {
// 		if (!this.isEqual()) {
// 			throw new Error('Counter is not equal for open and close count');
// 		}
// 		return this.openPos
// 			.map((pos, index) => new CountCoordinate(pos, this.closePos[this.length - index - 1]))
// 			.reverse();
// 	}
// 	lastCoordinate(): CountCoordinate {
// 		return new CountCoordinate(this.openPos[this.openPos.length - 1], this.closePos[this.closePos.length - 1]);
// 	}

// 	removeLastCoordinate() {
// 		this.openPos.pop();
// 		this.closePos.pop();
// 	}

// }

/**
 * operator parser
 */
export class TokenParser {
	constructor(private tokens: Token[]) { }

	/**
	 * Operator precedence
	 * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Operator_Precedence#table
	 */
	scan(): void {
		this.parseGrouping();
		this.parseMemberAccess();
		this.parseComputedMemberAccess();
		this.parseNewWithArgumentList();
		this.parseFunctionCall();
		this.parseOptionalChaining();

		this.parseNewWithoutArgumentList();

		this.parsePostfixIncrement();
		this.parsePostfixDecrement();

		this.parseLogicalNOT();
		this.parseBitwiseNOT();
		this.parseUnaryPlus();
		this.parseUnaryNegation();
		this.parsePrefixIncrement();
		this.parsePrefixDecrement();
		this.parseTypeof();
		this.parseVoid();
		this.parseDelete();
		this.parseAwait();

		// Exponentiation (**)	right-to-left	… ** …
		this.parseInfixNodeType(ArithmeticNode);

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
	scanStatements() { }
	parseGrouping(): void {
		let open: boolean;
		const stream = TokenStream.getTokenStream(this.tokens);
		while (open = stream.seekTo(TokenType.OPEN_PARENTHESES)) {
			if (open && !stream.lastToken()?.isFunctionCall()) {
				const start = stream.getPos() - 1;
				const group = stream.getStreamer(TokenType.CLOSE_PARENTHESES);
				const end = stream.getPos();

				const tokenParser = new TokenParser(group.toTokens());
				tokenParser.scan();
				const expression = tokenParser.tokens[0].value as ExpressionNode;
				const groupExpression = new Token(
					TokenType.EXPRESSION,
					new GroupingNode(expression)
				);
				this.tokens.splice(start, end - start, groupExpression);
				stream.setPos(start);
			}
		}
		// stream.reset();
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

				const tokenParser = new TokenParser(propertyName.toTokens());
				tokenParser.scan();
				const property = tokenParser.tokens[0].value as ExpressionNode;
				const propertyExpression = new Token(
					TokenType.EXPRESSION,
					new ComputedMemberAccessNode(this.tokens[start].value as ExpressionNode, property)
				);
				this.tokens.splice(start, end - start, propertyExpression);
				stream.setPos(start);
			}
		}
		// const count = new Counter();
		// for (let index = 0; index < this.tokens.length; index++) {
		// 	// object[property_name] syntax, the property_name is just a string or Symbol.
		// 	// object?.[property_name]
		// 	if (this.tokens[index].type === TokenType.OPEN_BRACKETS) {
		// 		if (this.tokens[index - 1]?.value !== '?.') {
		// 			count.incrementFalseOpen();		 // array
		// 			continue;
		// 		}
		// 		count.incrementOpened(index);
		// 	} else if (this.tokens[index].type === TokenType.CLOSE_BRACKETS) {
		// 		if (count.hasFalseOpen()) {
		// 			count.decrementFalseOpen();
		// 			continue;
		// 		}
		// 		count.incrementClosed(index);
		// 		const lastCoordinate = count.lastCoordinate();
		// 		const tokenParser = new TokenParser(this.tokens, lastCoordinate.start + 1, lastCoordinate.end);
		// 		tokenParser.scan();
		// 		if (this.tokens[lastCoordinate.start - 1].value === '?.') { // chaining
		// 			// will be parsed in chaining op
		// 			this.limit -= lastCoordinate.end - lastCoordinate.start;
		// 			index = lastCoordinate.start - 1;
		// 		} else {
		// 			const left = this.tokens[lastCoordinate.start - 1].value as ExpressionNode;
		// 			const right = this.tokens[lastCoordinate.start + 1].value as ExpressionNode;

		// 			const temp = new Token(TokenType.EXPRESSION, new ComputedMemberAccessNode(left, right!));
		// 			this.tokens.splice(index, 4, temp);
		// 			this.limit -= 3;
		// 			index = lastCoordinate.start;
		// 			count.removeLastCoordinate();
		// 		}
		// 	}
		// }
	}
	parseNewWithArgumentList() {
		// const count = new Counter();
		// for (let index = this.pos; index < Math.min(this.limit, this.tokens.length); index++) {
		// 	if (this.tokens[index].type === TokenType.OPEN_PARENTHESES) {
		// 		if (this.tokens[index - 1]?.type === TokenType.PROPERTY) { // a function call
		// 			count.incrementFalseOpen();
		// 			continue;
		// 		}
		// 		count.incrementOpened(index);
		// 	} else if (this.tokens[index].type === TokenType.CLOSE_PARENTHESES) {
		// 		if (count.hasFalseOpen()) {
		// 			count.decrementFalseOpen();
		// 			continue;
		// 		}
		// 		count.incrementClosed(index);
		// 		const lastCoordinate = count.lastCoordinate();
		// 		const tokenParser = new TokenParser(this.tokens, lastCoordinate.start + 1, lastCoordinate.end);
		// 		tokenParser.scan();
		// 		const temp = new Token(
		// 			TokenType.EXPRESSION,
		// 			new GroupingNode(this.tokens[lastCoordinate.start + 1].value as ExpressionNode)
		// 		);
		// 		this.tokens.splice(lastCoordinate.start, 3, temp);
		// 		this.limit -= lastCoordinate.end - lastCoordinate.start;
		// 		index = lastCoordinate.start;
		// 		count.removeLastCoordinate();
		// 	}
		// }
	}
	parseFunctionCall() {
		// const count = new Counter();
		// for (let index = this.pos; index < Math.min(this.limit, this.tokens.length); index++) {
		// 	if (this.tokens[index].type === TokenType.OPEN_PARENTHESES) {
		// 		if (this.tokens[index - 1]?.type === TokenType.PROPERTY) { // a function call
		// 			count.incrementFalseOpen();
		// 			continue;
		// 		}
		// 		count.incrementOpened(index);
		// 	} else if (this.tokens[index].type === TokenType.CLOSE_PARENTHESES) {
		// 		if (count.hasFalseOpen()) {
		// 			count.decrementFalseOpen();
		// 			continue;
		// 		}
		// 		count.incrementClosed(index);
		// 		const lastCoordinate = count.lastCoordinate();
		// 		const tokenParser = new TokenParser(this.tokens, lastCoordinate.start + 1, lastCoordinate.end);
		// 		tokenParser.scan();
		// 		const temp = new Token(
		// 			TokenType.EXPRESSION,
		// 			new GroupingNode(this.tokens[lastCoordinate.start + 1].value as ExpressionNode)
		// 		);
		// 		this.tokens.splice(lastCoordinate.start, 3, temp);
		// 		this.limit -= lastCoordinate.end - lastCoordinate.start;
		// 		index = lastCoordinate.start;
		// 		count.removeLastCoordinate();
		// 	}
		// }
	}

	parseOptionalChaining() {
		for (let index = 0; index < this.tokens.length; index++) {
			if (this.tokens[index].type === TokenType.OPERATOR && this.tokens[index].value === '?.') {
				let temp: Token;
				switch (this.tokens[index + 1].type) {
					case TokenType.OPEN_PARENTHESES:
						// function call
						// not supported yet
						// CommaNode

						break;
					case TokenType.OPEN_BRACKETS:
						// computed property access
						temp = new Token(
							TokenType.EXPRESSION,
							new OptionalChainingNode(
								this.tokens[index - 1].value as ExpressionNode,
								this.tokens[index + 2].value as ExpressionNode,
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
								this.tokens[index - 1].value as ExpressionNode,
								this.tokens[index + 1].value as ExpressionNode,
								'property'
							)
						)
						this.tokens.splice(index - 1, 3, temp);
						break;
				}
			}
		}
	}

	parseNewWithoutArgumentList() { }

	parsePostfixIncrement() { }
	parsePostfixDecrement() { }

	parseLogicalNOT() { }
	parseBitwiseNOT() { }
	parseUnaryPlus() { }
	parseUnaryNegation() { }
	parsePrefixIncrement() { }
	parsePrefixDecrement() { }
	parseTypeof() { }
	parseVoid() { }
	parseDelete() { }
	parseAwait() { }

	parsePipeline() {
		for (let index = 0; index < this.tokens.length; index++) {
			if (this.tokens[index].type === TokenType.OPERATOR) {
				if ('|>' === this.tokens[index].value) {
					const param = this.tokens[index - 1].value as ExpressionNode;
					const func = this.tokens[index + 1].value as ExpressionNode;
					let args: ExpressionNode[], paramterIndex: number;
					if (this.tokens[index + 2]?.value === ':') {
						paramterIndex = 0;
					} else if (this.tokens[index + 2]?.type === TokenType.COMMA) {

					} else if (this.tokens[index + 2]?.type === TokenType.OPEN_PARENTHESES) {

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
					const logical = this.tokens[index - 1].value as ExpressionNode;
					const ifTrue = this.tokens[index + 1].value as ExpressionNode;
					if (this.tokens[index + 2].value !== ':') {
						throw new Error(`not ternary operator`);
					}
					const ifFalse = this.tokens[index + 3].value as ExpressionNode;
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
	parseCommaSequence() { }

	private parseInfixNodeType(nodeType: NodeExpressionClass<ExpressionNode>): void {
		for (const op of nodeType.KEYWORDS!) {
			this.parseInfixNode(op, nodeType);
		}
	}

	private parseInfixNode(op: string, nodeType: NodeExpressionClass<ExpressionNode>): void {
		for (let index = 0; index < this.tokens.length; index++) {
			if (this.tokens[index].type === TokenType.OPERATOR) {
				if (op === this.tokens[index].value) {
					const temp = new Token(
						TokenType.EXPRESSION,
						new nodeType(
							op,
							this.tokens[index - 1].value as ExpressionNode,
							this.tokens[index + 1].value as ExpressionNode
						)
					);
					this.tokens.splice(index - 1, 3, temp);
					index--;
				}
			}
		}
	}

}

export class Parser {
	parse(expression: string) {
		const stream: TokenStream = TokenStream.getTokenStream(expression);
		const tokens: Token[] = stream.toTokens();
		tokens.forEach(t => console.log(t));
		const tokenParser = new TokenParser(tokens);
		tokenParser.scan();
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
	statement = `x.y > 8 ? (a = b + c): (a = b + (9 |> Math.trunc))`;

	const tokensJS = parser.parse(statement);
	const stack = ScopeProvider.for({});
	Reflect.set(window, 'parser', parser.parse);
	Reflect.set(window, 'tokens', tokensJS);
	Reflect.set(window, 'stack', stack);
	Reflect.set(window, 'getTokenStream', TokenStream.getTokenStream);
	console.log(statement);
	console.log(tokensJS[0].value);
} catch (error) {
	console.error(error);
}
