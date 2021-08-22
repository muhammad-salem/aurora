import type { NodeDeserializer, ExpressionNode } from '../../expression';
import type { StackProvider } from '../../scope';
import { AbstractExpressionNode } from '../../abstract';
import { Deserializer } from '../../deserialize/deserialize';

/**
 * The if statement executes a statement if a specified condition is truthy.
 * If the condition is falsy, another statement can be executed.
 * 
 */
@Deserializer('IfStatement')
export class IfElseNode extends AbstractExpressionNode {
	static fromJSON(node: IfElseNode, deserializer: NodeDeserializer): IfElseNode {
		return new IfElseNode(
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
	set(stack: StackProvider, value: any) {
		throw new Error(`IfElseNode#set() has no implementation.`);
	}
	get(stack: StackProvider) {
		stack = stack.newStack();
		const condition = this.test.get(stack);
		if (condition) {
			return this.consequent.get(stack);
		} else if (this.alternate) {
			return this.alternate.get(stack);
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
