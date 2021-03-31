
import type { NodeDeserializer, ExpressionNode } from '../../expression.js';
import type { ScopedStack } from '../../scope.js';
import { AbstractExpressionNode } from '../../abstract.js';
import { Deserializer } from '../../deserialize/deserialize.js';
import { TerminateNode } from './terminate.js';


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
			deserializer(node.condition as any),
			node.cases.map(item => { return { key: deserializer(item.key), statement: deserializer(item.statement) } })
		);
	}
	constructor(private condition: ExpressionNode, private cases: { key: ExpressionNode, statement: ExpressionNode }[]) {
		super();
	}
	getCondition() {
		return this.condition;
	}
	getCases() {
		return this.cases;
	}
	set(stack: ScopedStack, value: any) {
		throw new Error(`SwitchNode#set() has no implementation.`);
	}
	get(stack: ScopedStack) {
		stack = stack.newStack();
		const condition = this.condition.get(stack);
		for (let i = 0; i < this.cases.length; i++) {
			const caseValue = this.cases[i].key.get(stack);
			if (condition === caseValue) {
				let returnValue = this.cases[i].statement.get(stack);
				if (returnValue === TerminateNode.BreakSymbol) {
					break;
				} else {
					for (++i; i < this.cases.length; i++) {
						this.cases[i].statement.get(stack);
					}
				}
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
		return `switch (${this.condition.toString()}) {${this.cases.map(item => `case: ${item.key.toString()}: ${item.statement.toString()}`).join(' ')}}`;
	}
	toJson(): object {
		return {
			condition: this.condition.toJSON(),
			cases: this.cases.map(item => {
				return {
					key: item.key.toJSON(),
					statement: item.statement.toJSON()
				}
			})
		};
	}
}
