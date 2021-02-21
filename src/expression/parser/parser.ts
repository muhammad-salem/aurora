import type { ExpressionNode, NodeExpressionClass } from '../api/expression.js';
import { ScopeProvider } from '../api/context/provider.js';
import { ComputedMemberAccessNode, MemberAccessNode } from '../api/definition/member.js';
import { ArithmeticNode } from '../api/operators/arithmetic.js';
import { AssignmentNode } from '../api/operators/assignment.js';
import { OptionalChainingNode } from '../api/operators/chaining.js';
import { EqualityNode } from '../api/operators/equality.js';
import { GroupingNode } from '../api/operators/grouping.js';
import { LogicalAssignmentNode, LogicalNode } from '../api/operators/logical.js';
import { RelationalNode } from '../api/operators/relational.js';
import { BinaryBitwiseNode, BitwiseShiftNode } from '../api/operators/shift.js';
import { TokenStream } from './stream.js';
import { Token, TokenType } from './token.js';

export class CountCoordinate {
	constructor(public start: number, public end: number) { }

	get length(): number {
		return this.end - this.start + 1;
	}
}

export class Counter {
	private open = 0;
	private openPos: number[] = [];
	private falseOpen = 0;
	private close = 0;
	private closePos: number[] = [];
	incrementOpened(pos: number) {
		this.open++;
		this.openPos.push(pos);
	}
	incrementClosed(pos: number) {
		this.close++;
		this.closePos.push(pos);
	}
	incrementFalseOpen() {
		this.falseOpen++;
	}
	decrementFalseOpen() {
		this.falseOpen--;
	}

	hasFalseOpen(): boolean {
		return this.falseOpen > 0;
	}

	isEqual() {
		return this.open === this.close;
	}

	isMulti() {
		return this.open > 1;
	}

	get length(): number {
		return this.closePos.length;
	}

	coordinate(): CountCoordinate[] {
		if (!this.isEqual()) {
			throw new Error('Counter is not equal for open and close count');
		}
		return this.openPos
			.map((pos, index) => new CountCoordinate(pos, this.closePos[this.length - index - 1]))
			.reverse();
	}
	lastCoordinate(): CountCoordinate {
		return new CountCoordinate(this.openPos[this.openPos.length - 1], this.closePos[this.closePos.length - 1]);
	}

	removeLastCoordinate() {
		this.openPos.pop();
		this.closePos.pop();
	}

}


export class TokenParser {

	constructor(private tokens: Token[], private pos: number = 0, private limit: number = tokens.length) { }
	parseSemicolon(): void {

	}

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

		this.parseInfixNodeType(ArithmeticNode);

		this.parseInfixNodeType(BitwiseShiftNode);
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
		const count = new Counter();
		for (let index = this.pos; index < Math.min(this.limit, this.tokens.length); index++) {
			if (this.tokens[index].type === TokenType.OPEN_PARENTHESES) {
				if (this.tokens[index - 1]?.type === TokenType.EXPRESSION || this.tokens[index - 1]?.value === '?.') { // a function call
					count.incrementFalseOpen();
					continue;
				}
				count.incrementOpened(index);
			} else if (this.tokens[index].type === TokenType.CLOSE_PARENTHESES) {
				if (count.hasFalseOpen()) {
					count.decrementFalseOpen();
					continue;
				}
				count.incrementClosed(index);
				const lastCoordinate = count.lastCoordinate();
				const tokenParser = new TokenParser(this.tokens, lastCoordinate.start + 1, lastCoordinate.end);
				tokenParser.scan();
				const temp = new Token(
					TokenType.EXPRESSION,
					new GroupingNode(this.tokens[lastCoordinate.start + 1].value as ExpressionNode)
				);
				this.tokens.splice(lastCoordinate.start, 3, temp);
				this.limit -= lastCoordinate.end - lastCoordinate.start;
				index = lastCoordinate.start;
				count.removeLastCoordinate();
			}
		}
	}
	parseMemberAccess(): void {
		for (let index = Math.min(this.limit, this.tokens.length) - 2; index >= this.pos; index--) {
			if (this.tokens[index].type === TokenType.OPERATOR && this.tokens[index].value === '.') {
				const temp = new Token(
					TokenType.EXPRESSION,
					new MemberAccessNode(
						this.tokens[index - 1].value as ExpressionNode,
						this.tokens[index + 1].value as ExpressionNode
					)
				);
				this.tokens.splice(index - 1, 3, temp);
				this.limit -= 2;
			}
		}
	}

	parseComputedMemberAccess(): void {
		const count = new Counter();
		for (let index = 0; index < Math.min(this.limit, this.tokens.length); index++) {
			// object[property_name] syntax, the property_name is just a string or Symbol.
			// object?.[property_name]
			if (this.tokens[index].type === TokenType.OPEN_BRACKETS) {
				if (this.tokens[index - 1]?.value !== '?.') {
					count.incrementFalseOpen();		 // array
					continue;
				}
				count.incrementOpened(index);
			} else if (this.tokens[index].type === TokenType.CLOSE_BRACKETS) {
				if (count.hasFalseOpen()) {
					count.decrementFalseOpen();
					continue;
				}
				count.incrementClosed(index);
				const lastCoordinate = count.lastCoordinate();
				const tokenParser = new TokenParser(this.tokens, lastCoordinate.start + 1, lastCoordinate.end);
				tokenParser.scan();
				if (this.tokens[lastCoordinate.start - 1].value === '?.') { // chaining
					// will be parsed in chaining op
					this.limit -= lastCoordinate.end - lastCoordinate.start;
					index = lastCoordinate.start - 1;
				} else {
					const left = this.tokens[lastCoordinate.start - 1].value as ExpressionNode;
					const right = this.tokens[lastCoordinate.start + 1].value as ExpressionNode;

					const temp = new Token(TokenType.EXPRESSION, new ComputedMemberAccessNode(left, right!));
					this.tokens.splice(index, 4, temp);
					this.limit -= 3;
					index = lastCoordinate.start;
					count.removeLastCoordinate();
				}
			}
		}
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
		for (let index = this.pos; index < Math.min(this.limit, this.tokens.length); index++) {
			if (this.tokens[index].type === TokenType.OPERATOR && this.tokens[index].value === '?.') {
				let temp: Token;
				switch (this.tokens[index + 1].type) {
					case TokenType.OPEN_PARENTHESES:
						// function call
						// not supported yet
						break;
					case TokenType.OPEN_BRACKETS:
						// computed property access
						temp = new Token(
							TokenType.EXPRESSION,
							new OptionalChainingNode(
								this.tokens[index - 1].value as ExpressionNode,
								this.tokens[index + 2].value as ExpressionNode,
								'computed'
							)
						)
						this.tokens.splice(index - 1, 5, temp);
						this.limit -= 4;
						break;
					case TokenType.EXPRESSION:
						// property access
						temp = new Token(
							TokenType.EXPRESSION,
							new OptionalChainingNode(
								this.tokens[index - 1].value as ExpressionNode,
								this.tokens[index + 1].value as ExpressionNode,
								'access'
							)
						)
						this.tokens.splice(index - 1, 3, temp);
						this.limit -= 2;
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

	parsePipeline() { }
	parseTernary() { }

	// parseYield(){}
	// parseYieldAstr(){}
	parseCommaSequence() { }

	private parseInfixNodeType(nodeType: NodeExpressionClass<ExpressionNode>): void {
		for (const op of nodeType.KEYWORDS!) {
			this.parseInfixNode(op, nodeType);
		}
	}

	private parseInfixNode(op: string, nodeType: NodeExpressionClass<ExpressionNode>): void {
		for (let index = this.pos; index < Math.min(this.limit, this.tokens.length); index++) {
			if (this.tokens[index].type === TokenType.OPERATOR) {
				if (op === this.tokens[index].value) {
					const leftParser = new TokenParser(this.tokens, this.pos, index);
					leftParser.scan();
					const rightParser = new TokenParser(this.tokens, index + 1, this.limit);
					rightParser.scan();
					const temp = new Token(
						TokenType.EXPRESSION,
						new nodeType(
							op,
							this.tokens[index - 1].value as ExpressionNode,
							this.tokens[index + 1].value as ExpressionNode
						)
					);
					this.tokens.splice(index - 1, 3, temp);
					this.limit -= (leftParser.limit - leftParser.pos) + (rightParser.limit - rightParser.pos);
					index = index - 1;
				}
			}
		}
	}

}

export class Parser {



	parse(expression: string) {
		const stream: TokenStream = new TokenStream(expression);
		const tokens: Token[] = [];
		let token: Token;
		while (true) {
			token = stream.next();
			if (token.type === TokenType.EOF) {
				break;
			}
			tokens.push(token);
		}
		const tokenParser = new TokenParser(tokens);
		tokenParser.scan();
		return tokens;
	}

}

const parser = new Parser();
const tokensJS = parser.parse(`9 + ( 2 * 3 - (5+6) + (4 / 8))`);
//const tokens = parser.parse(`0 1 2 3 4 5 6 78901 2 34 5 678`);
// const tokensJS = parser.parse(`x.y?.zp[4]`);

const stack = ScopeProvider.for({});
Reflect.set(window, 'parser', parser.parse);
Reflect.set(window, 'tokens', tokensJS);
Reflect.set(window, 'stack', stack);
console.log(tokensJS);
