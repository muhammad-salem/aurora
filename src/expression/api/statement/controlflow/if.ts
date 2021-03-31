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
	static KEYWORDS = ['if', 'else'];
	static fromJSON(node: IfElseNode, deserializer: NodeDeserializer): IfElseNode {
		return new IfElseNode(
			deserializer(node.condition),
			deserializer(node.statement),
			node.elseIf ? deserializer(node.elseIf) : void 0
		);
	}
	constructor(private condition: ExpressionNode, private statement: ExpressionNode, private elseIf?: ExpressionNode) {
		super();
	}
	getCondition() {
		return this.condition;
	}
	getStatement() {
		return this.statement;
	}
	getElseIf() {
		return this.elseIf;
	}
	set(stack: ScopedStack, value: any) {
		throw new Error(`IfElseNode#set() has no implementation.`);
	}
	get(stack: ScopedStack) {
		stack = stack.newStack();
		const condition = this.condition.get(stack);
		if (condition) {
			return this.statement.get(stack);
		} else if (this.elseIf) {
			return this.elseIf.get(stack);
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
		return `if (${this.condition.toString()}) ${this.statement.toString()}${this.elseIf ? ' else ' : ''}${this.elseIf ? this.elseIf.toString() : ''}`;
	}
	toJson(): object {
		return {
			condition: this.condition.toJSON(),
			statement: this.statement.toJSON(),
			elseIf: this.elseIf?.toJSON()
		};
	}
}
