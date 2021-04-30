import type { NodeDeserializer, ExpressionNode } from '../../expression.js';
import type { ScopedStack } from '../../scope.js';
import { AbstractExpressionNode } from '../../abstract.js';
import { Deserializer } from '../../deserialize/deserialize.js';
import { TerminateNode } from '../controlflow/terminate.js';
import { ReturnValue } from '../../computing/return.js';

/**
 * The while statement creates a loop that executes a specified
 * statement as long as the test condition evaluates to true.
 * The condition is evaluated before executing the statement.
 * 
 */
@Deserializer('while')
export class WhileNode extends AbstractExpressionNode {
	static fromJSON(node: WhileNode, deserializer: NodeDeserializer): WhileNode {
		return new WhileNode(
			deserializer(node.condition),
			deserializer(node.statement)
		);
	}
	constructor(private condition: ExpressionNode, private statement: ExpressionNode) {
		super();
	}
	getCondition() {
		return this.condition;
	}
	getStatement() {
		return this.statement;
	}
	set(stack: ScopedStack, value: any) {
		throw new Error(`WhileNode#set() has no implementation.`);
	}
	get(stack: ScopedStack) {
		stack = stack.newStack();
		const condition = this.condition.get(stack);
		while (condition) {
			const result = this.statement.get(stack);
			// useless case, as it at the end of for statement
			// an array/block statement, should return last signal
			if (TerminateNode.ContinueSymbol === result) {
				continue;
			}
			if (TerminateNode.BreakSymbol === result) {
				break;
			}
			if (result instanceof ReturnValue) {
				return result;
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
		return `while (${this.condition.toString()}) ${this.statement.toString()}`;
	}
	toJson(): object {
		return {
			condition: this.condition.toJSON(),
			statement: this.statement.toJSON()
		};
	}
}

@Deserializer('do-while')
export class DoWhileNode extends AbstractExpressionNode {
	static fromJSON(node: DoWhileNode, deserializer: NodeDeserializer): DoWhileNode {
		return new DoWhileNode(
			deserializer(node.condition),
			deserializer(node.statement)
		);
	}
	constructor(private condition: ExpressionNode, private statement: ExpressionNode) {
		super();
	}
	getCondition() {
		return this.condition;
	}
	getStatement() {
		return this.statement;
	}
	set(stack: ScopedStack, value: any) {
		throw new Error(`WhileNode#set() has no implementation.`);
	}
	get(stack: ScopedStack) {
		stack = stack.newStack();
		const condition = this.condition.get(stack);
		do {
			const result = this.statement.get(stack);
			// useless case, as it at the end of for statement
			// an array/block statement, should return last signal
			if (TerminateNode.ContinueSymbol === result) {
				continue;
			}
			if (TerminateNode.BreakSymbol === result) {
				break;
			}
			if (result instanceof ReturnValue) {
				return result;
			}
		} while (this.condition.get(stack));
		return void 0;
	}
	entry(): string[] {
		return [];
	}
	event(parent?: string): string[] {
		return [];
	}
	toString(): string {
		return `do {${this.statement.toString()}} while (${this.condition.toString()})`;
	}
	toJson(): object {
		return {
			condition: this.condition.toJSON(),
			statement: this.statement.toJSON()
		};
	}
}
