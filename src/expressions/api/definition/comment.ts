import type { ExpressionEventPath, ExpressionNode } from '../expression.js';
import type { Scope } from '../../scope/scope.js';
import type { Stack } from '../../scope/stack.js';
import { AbstractExpressionNode } from '../abstract.js';
import { Deserializer } from '../deserialize/deserialize.js';

@Deserializer('CommentExpression')
export class CommentExpression extends AbstractExpressionNode {
	static fromJSON(nodeExp: CommentExpression): CommentExpression {
		return new CommentExpression(nodeExp.comment);
	}
	constructor(private comment: string) {
		super();
	}
	getComment() {
		return this.comment;
	}
	shareVariables(scopeList: Scope<any>[]): void { }
	set(stack: Stack, ...values: any[]) { }
	get(stack: Stack) { }
	dependency(): ExpressionNode[] {
		return [];
	}
	dependencyPath(): ExpressionEventPath[] {
		return [];
	}
	toString(): string {
		return this.comment;
	}
	toJson(): object {
		return { comment: this.comment };
	}
}
