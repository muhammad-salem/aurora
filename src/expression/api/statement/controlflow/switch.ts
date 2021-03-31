
import type { NodeDeserializer, ExpressionNode } from '../../expression.js';
import type { ScopedStack } from '../../scope.js';
import { AbstractExpressionNode } from '../../abstract.js';
import { Deserializer } from '../../deserialize/deserialize.js';
import { TerminateNode } from './terminate.js';
import { PropertyNode } from '../../definition/values.js';


@Deserializer('case')
export class CaseExpression extends AbstractExpressionNode {
	static KEYWORDS = ['case'];
	static fromJSON(node: CaseExpression, deserializer: NodeDeserializer): CaseExpression {
		return new CaseExpression(
			deserializer(node.value),
			deserializer(node.block)
		);
	}
	constructor(private value: ExpressionNode, private block: ExpressionNode) {
		super();
	}
	getValue() {
		return this.value;
	}
	getBlock() {
		return this.block;
	}
	set(stack: ScopedStack, value: any) {
		throw new Error(`CaseExpression#set() has no implementation.`);
	}
	get(stack: ScopedStack) {
		return this.block.get(stack);
	}
	entry(): string[] {
		return [];
	}
	event(parent?: string): string[] {
		return [];
	}
	toString(): string {
		const caseString = this.value.toString();
		if (caseString === 'default') {
			return `default: ${this.block.toString()};`;
		} else {
			return `case ${caseString}: ${this.block.toString()};`;
		}
	}
	toJson(): object {
		return {
			value: this.value.toJSON(),
			block: this.block.toJSON()
		};
	}
}

const DEFAULT_KEYWORD = 'default';
const DefaultNode = Object.freeze(new PropertyNode(DEFAULT_KEYWORD)) as PropertyNode;

/**
 * The switch statement evaluates an expression, matching the expression's value to a case clause,
 * and executes statements associated with that case,
 * as well as statements in cases that follow the matching case.
 * 
 */
@Deserializer('switch')
export class SwitchNode extends AbstractExpressionNode {
	static KEYWORDS = ['switch'];
	static fromJSON(node: SwitchNode, deserializer: NodeDeserializer): SwitchNode {
		return new SwitchNode(
			deserializer(node.expression),
			node.cases.map(deserializer) as CaseExpression[]
		);
	}
	constructor(private expression: ExpressionNode, private cases: CaseExpression[]) {
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
		const values = this.cases.map(item => item.getValue().get(stack));
		let startIndex = values.findIndex(item => result === item);
		if (startIndex === -1) {
			startIndex = values.findIndex(value => DEFAULT_KEYWORD === value);
			if (startIndex === -1) {
				return;
			}
		}
		for (let index = startIndex; index < this.cases.length; index++) {
			const returnValue = this.cases[index].get(stack);
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
		return `switch (${this.expression.toString()}) {${this.cases.map(item => item.toString())}`;
	}
	toJson(): object {
		return {
			expression: this.expression.toJSON(),
			cases: this.cases.map(item => item.toJSON())
		};
	}
}
