import type { NodeDeserializer, ExpressionNode } from '../expression.js';
import type { StackProvider } from '../scope.js';
import { AbstractExpressionNode } from '../abstract.js';
import { Deserializer } from '../deserialize/deserialize.js';

/**
 * The grouping operator consists of a pair of parentheses around
 * an expression or sub-expression to override the normal operator
 * precedence so that expressions with lower precedence can be evaluated
 * before an expression with higher priority.
 * As it sounds, it groups what's inside of the parentheses.
 */
@Deserializer('GroupingExpression')
export class GroupingNode extends AbstractExpressionNode {
	static fromJSON(node: GroupingNode, deserializer: NodeDeserializer): GroupingNode {
		return new GroupingNode(deserializer(node.node as any));
	}
	constructor(private node: ExpressionNode) {
		super();
	}
	getNode() {
		return this.node;
	}
	set(stack: StackProvider, value: any) {
		this.node.set(stack, value);
	}
	get(stack: StackProvider,) {
		return this.node.get(stack);
	}
	entry(): string[] {
		return this.node.entry();
	}
	event(parent?: string): string[] {
		return this.node.event(parent);
	}
	toString(): string {
		return `(${this.node.toString()})`;
	}
	toJson(): object {
		return { node: this.node.toJSON() };
	}
}
