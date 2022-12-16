import type {
	NodeDeserializer, ExpressionNode, ExpressionEventPath,
	VisitNodeType, SourceLocation
} from '../expression.js';
import type { Stack } from '../../scope/stack.js';
import { Deserializer } from '../deserialize/deserialize.js';
import { AbstractExpressionNode, AwaitPromise } from '../abstract.js';


@Deserializer('AwaitExpression')
export class AwaitExpression extends AbstractExpressionNode {
	static fromJSON(node: AwaitExpression, serializer: NodeDeserializer): AwaitExpression {
		return new AwaitExpression(serializer(node.argument), node.loc);
	}
	static visit(node: AwaitExpression, visitNode: VisitNodeType): void {
		visitNode(node.argument);
	}
	constructor(private argument: ExpressionNode, loc?: SourceLocation) {
		super(loc);
	}
	getArgument() {
		return this.argument;
	}
	set(stack: Stack, value: any) {
		throw new Error('AwaitExpression#set() has no implementation.');
	}
	get(stack: Stack, thisContext?: any) {
		const promise = this.argument.get(stack);
		return new AwaitPromise(promise);
	}
	dependency(computed?: true): ExpressionNode[] {
		return this.argument.dependency(computed);
	}
	dependencyPath(computed?: true): ExpressionEventPath[] {
		return this.argument.dependencyPath(computed);
	}
	toString() {
		return `await ${this.argument.toString()}`;
	}
	toJson(): object {
		return {
			argument: this.argument.toJSON()
		};
	}
}
