import { Stack } from '../../scope/stack.js';
import { AbstractExpressionNode } from '../abstract.js';
import { Deserializer } from '../deserialize/deserialize.js';
import { ExpressionEventPath, ExpressionNode, NodeDeserializer, VisitNodeType } from '../expression.js';

@Deserializer('Decorator')
export class Decorator extends AbstractExpressionNode {
	static fromJSON(node: Decorator, deserializer: NodeDeserializer<any>): Decorator {
		return new Decorator(deserializer(node.expression));
	}
	static visit(node: Decorator, visitNode: VisitNodeType): void {
		visitNode(node.expression);
	}
	constructor(private expression: ExpressionNode) {
		super();
	}
	getExpression() {
		return this.expression;
	}
	set(stack: Stack, value: any) {
		throw new Error('Decorator#set() Method not implemented.');
	}
	get(stack: Stack) {
		return this.expression.get(stack);
	}
	dependency(computed?: true): ExpressionNode[] {
		return this.expression.dependency(computed);
	}
	dependencyPath(computed?: true): ExpressionEventPath[] {
		return this.expression.dependencyPath(computed);
	}
	toString(): string {
		return `@${this.expression.toString()}`;
	}
	toJson(): { [key: string]: any; } {
		return {
			expression: this.expression.toJSON()
		};
	}
}
