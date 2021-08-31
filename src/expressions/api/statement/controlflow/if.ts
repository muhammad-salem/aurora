import type { NodeDeserializer, ExpressionNode } from '../../expression.js';
import type { Stack } from '../../../scope/stack.js';
import { AbstractExpressionNode } from '../../abstract.js';
import { Deserializer } from '../../deserialize/deserialize.js';

/**
 * The if statement executes a statement if a specified condition is truthy.
 * If the condition is falsy, another statement can be executed.
 * 
 */
@Deserializer('IfStatement')
export class IfStatement extends AbstractExpressionNode {
	static fromJSON(node: IfStatement, deserializer: NodeDeserializer): IfStatement {
		return new IfStatement(
			deserializer(node.test),
			deserializer(node.consequent),
			node.alternate ? deserializer(node.alternate) : void 0
		);
	}
	constructor(private test: ExpressionNode, private consequent: ExpressionNode, private alternate?: ExpressionNode) {
		super();
	}
	getTest() {
		return this.test;
	}
	getConsequent() {
		return this.consequent;
	}
	getAlternate() {
		return this.alternate;
	}
	set(stack: Stack, value: any) {
		throw new Error(`IfStatement#set() has no implementation.`);
	}
	get(stack: Stack) {
		const condition = this.test.get(stack);
		if (condition) {
			const ifBlock = stack.pushBlockScope();
			const value = this.consequent.get(stack);
			stack.clearTo(ifBlock);
			return value;
		} else if (this.alternate) {
			const elseBlock = stack.pushBlockScope();
			const value = this.alternate.get(stack);
			stack.clearTo(elseBlock);
			return value;
		}
		return void 0;
	}
	entry(): string[] {
		return this.test.entry().concat(this.consequent.entry()).concat(this.alternate?.entry() || []);
	}
	event(parent?: string): string[] {
		return this.test.event().concat(this.consequent.event()).concat(this.alternate?.event() || []);
	}
	toString(): string {
		return `if (${this.test.toString()}) ${this.consequent.toString()}${this.alternate ? ' else ' : ''}${this.alternate ? this.alternate.toString() : ''}`;
	}
	toJson(): object {
		return {
			test: this.test.toJSON(),
			consequent: this.consequent.toJSON(),
			alternate: this.alternate?.toJSON()
		};
	}
}
