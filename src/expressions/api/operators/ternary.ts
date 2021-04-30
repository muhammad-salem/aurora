import type { NodeDeserializer, ExpressionNode } from '../expression.js';
import { AbstractExpressionNode } from '../abstract.js';
import { ScopedStack } from '../scope.js';
import { Deserializer } from '../deserialize/deserialize.js';

@Deserializer('ternary')
export class TernaryNode extends AbstractExpressionNode {
	static fromJSON(node: TernaryNode, deserializer: NodeDeserializer): TernaryNode {
		return new TernaryNode(
			deserializer(node.condition),
			deserializer(node.exprIfTrue),
			deserializer(node.exprIfFalse)
		);
	}
	constructor(private condition: ExpressionNode, private exprIfTrue: ExpressionNode, private exprIfFalse: ExpressionNode) {
		super();
	}
	getLogical() {
		return this.condition;
	}
	getExprIfTrue() {
		return this.exprIfTrue;
	}
	getExprIfFalse() {
		return this.exprIfFalse;
	}
	set(stack: ScopedStack, value: any) {
		throw new Error(`TernaryNode#set() has no implementation.`);
	}
	get(stack: ScopedStack) {
		return this.condition.get(stack) ? this.exprIfFalse.get(stack) : this.exprIfTrue.get(stack);
	}
	entry(): string[] {
		return [...this.condition.entry(), ...this.exprIfTrue.entry(), ...this.exprIfFalse.entry()];
	}
	event(parent?: string): string[] {
		return [];
	}
	toString() {
		return `${this.condition.toString()} ? (${this.exprIfTrue.toString()}):(${this.exprIfFalse.toString()})`;
	}
	toJson(): object {
		return {
			condition: this.condition.toJSON(),
			exprIfTrue: this.exprIfTrue.toJSON(),
			exprIfFalse: this.exprIfFalse.toJSON()
		};
	}
}
