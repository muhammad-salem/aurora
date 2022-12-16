import type {
	NodeDeserializer, ExpressionNode, ExpressionEventPath,
	VisitNodeType, SourceLocation
} from '../expression.js';
import type { Stack } from '../../scope/stack.js';
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
export class GroupingExpression extends AbstractExpressionNode {
	static fromJSON(node: GroupingExpression, deserializer: NodeDeserializer): GroupingExpression {
		return new GroupingExpression(deserializer(node.node), node.loc);
	}
	static visit(node: GroupingExpression, visitNode: VisitNodeType): void {
		visitNode(node.node);
	}
	constructor(private node: ExpressionNode, loc?: SourceLocation) {
		super(loc);
	}
	getNode() {
		return this.node;
	}
	set(stack: Stack, value: any) {
		this.node.set(stack, value);
	}
	get(stack: Stack,) {
		return this.node.get(stack);
	}
	dependency(computed?: true): ExpressionNode[] {
		return this.node.dependency(computed);
	}
	dependencyPath(computed?: true): ExpressionEventPath[] {
		return this.node.dependencyPath(computed);
	}
	toString(): string {
		return `(${this.node.toString()})`;
	}
	toJson(): object {
		return { node: this.node.toJSON() };
	}
}
