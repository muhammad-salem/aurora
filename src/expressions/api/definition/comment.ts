import type { ExpressionEventPath, ExpressionNode, SourceLocation } from '../expression.js';
import type { Stack } from '../../scope/stack.js';
import { AbstractExpressionNode } from '../abstract.js';
import { Deserializer } from '../deserialize/deserialize.js';

@Deserializer('CommentExpression')
export class CommentExpression extends AbstractExpressionNode {
	static fromJSON(node: CommentExpression): CommentExpression {
		return new CommentExpression(node.comment, node.loc);
	}
	constructor(private comment: string, loc?: SourceLocation) {
		super(loc);
	}
	getComment() {
		return this.comment;
	}
	set(stack: Stack, ...values: any[]) { }
	get(stack: Stack) { }
	dependency(computed?: true): ExpressionNode[] {
		return [];
	}
	dependencyPath(computed?: true): ExpressionEventPath[] {
		return [];
	}
	toString(): string {
		return this.comment;
	}
	toJson(): object {
		return { comment: this.comment };
	}
}
