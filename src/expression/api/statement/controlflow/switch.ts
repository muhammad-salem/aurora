
import type { NodeDeserializer, ExpressionNode } from '../../expression.js';
import type { ScopedStack } from '../../scope.js';
import { AbstractExpressionNode } from '../../abstract.js';
import { Deserializer } from '../../deserialize/deserialize.js';
import { TerminateNode } from './terminate.js';


@Deserializer('default')
export class DefaultCaseExpression extends AbstractExpressionNode {
	static DEFAULT_KEYWORD = 'default';
	static fromJSON(node: ExpressionNode, deserializer: NodeDeserializer<DefaultCaseExpression>): DefaultCaseExpression {
		return DefaultNode;
	}
	set(stack: ScopedStack, value: any) {
		throw new Error('Method DefaultCaseExpression.#set() not implemented.');
	}
	get(stack: ScopedStack) {
		return DefaultCaseExpression.DEFAULT_KEYWORD;
	}
	entry(): string[] {
		return [];
	}
	event(parent?: string): string[] {
		return [];
	}
	toString(): string {
		return DefaultCaseExpression.DEFAULT_KEYWORD;
	}
	toJson(key?: string) {
		return {};
	}
}

const DefaultNode = Object.freeze(new DefaultCaseExpression()) as DefaultCaseExpression;

/**
 * The switch statement evaluates an expression, matching the expression's value to a case clause,
 * and executes statements associated with that case,
 * as well as statements in cases that follow the matching case.
 * 
 */
@Deserializer('switch')
export class SwitchNode extends AbstractExpressionNode {
	static KEYWORDS = ['switch', 'case'];
	static fromJSON(node: SwitchNode, deserializer: NodeDeserializer): SwitchNode {
		return new SwitchNode(
			deserializer(node.expression as any),
			node.cases.map(item => { return { key: deserializer(item.key), statement: deserializer(item.statement) } })
		);
	}
	constructor(private expression: ExpressionNode, private cases: { key: ExpressionNode, statement: ExpressionNode }[]) {
		super();
	}
	getExpression() {
		return this.expression;
	}
	getCases() {
		return this.cases;
	}
	set(stack: ScopedStack, value: any) {
		throw new Error(`SwitchNode#set() has no implementation.`);
	}
	get(stack: ScopedStack) {
		// need to fix statements execution and support default case
		stack = stack.newStack();
		const result = this.expression.get(stack);
		const resolvedCases = this.cases.map(item => { return { key: item.key.get(stack), statement: item.statement } });
		let startIndex = resolvedCases.findIndex(item => result === item.key);
		if (startIndex === -1) {
			startIndex = resolvedCases.findIndex(item => DefaultCaseExpression.DEFAULT_KEYWORD === item.key);
			if (startIndex === -1) {
				return;
			}
		}
		for (let index = startIndex; index < resolvedCases.length; index++) {
			const returnValue = this.cases[index].statement.get(stack);
			if (returnValue === TerminateNode.BreakSymbol) {
				break;
			}
		}
		return void 0;
	}
	entry(): string[] {
		return [];
	}
	event(parent?: string): string[] {
		return [];
	}
	toString(): string {
		return `switch (${this.expression.toString()}) {${this.cases.map(item => `case: ${item.key.toString()}: ${item.statement.toString()}`).join(' ')}}`;
	}
	toJson(): object {
		return {
			expression: this.expression.toJSON(),
			cases: this.cases.map(item => {
				return {
					key: item.key.toJSON(),
					statement: item.statement.toJSON()
				}
			})
		};
	}
}
