import type { NodeDeserializer, ExpressionNode } from '../../expression.js';
import type { ScopedStack } from '../../scope.js';
import { AbstractExpressionNode } from '../../abstract.js';
import { Deserializer } from '../../deserialize/deserialize.js';

/**
 * The if statement executes a statement if a specified condition is truthy.
 * If the condition is falsy, another statement can be executed.
 * 
 */
@Deserializer('if')
export class IfElseNode extends AbstractExpressionNode {
	static fromJSON(node: IfElseNode, deserializer: NodeDeserializer): IfElseNode {
		return new IfElseNode(
			deserializer(node.condition),
			deserializer(node.thenStatement),
			node.elseStatement ? deserializer(node.elseStatement) : void 0
		);
	}
	constructor(private condition: ExpressionNode, private thenStatement: ExpressionNode, private elseStatement?: ExpressionNode) {
		super();
	}
	getCondition() {
		return this.condition;
	}
	getTHenStatement() {
		return this.thenStatement;
	}
	getElseStatement() {
		return this.elseStatement;
	}
	set(stack: ScopedStack, value: any) {
		throw new Error(`IfElseNode#set() has no implementation.`);
	}
	get(stack: ScopedStack) {
		stack = stack.newStack();
		const condition = this.condition.get(stack);
		if (condition) {
			return this.thenStatement.get(stack);
		} else if (this.elseStatement) {
			return this.elseStatement.get(stack);
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
		return `if (${this.condition.toString()}) ${this.thenStatement.toString()}${this.elseStatement ? ' else ' : ''}${this.elseStatement ? this.elseStatement.toString() : ''}`;
	}
	toJson(): object {
		return {
			condition: this.condition.toJSON(),
			thenStatement: this.thenStatement.toJSON(),
			elseStatement: this.elseStatement?.toJSON()
		};
	}
}
