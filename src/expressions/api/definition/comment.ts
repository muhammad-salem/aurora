
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

	/**
	 * 
	 * @param context execution stack/scope context
	 * @param value any paramter
	 */
	set(stack: Stack, ...values: any[]) {

	}

	/**
	 * used when define a function
	 * @param context execution stack/scope context
	 */
	get(stack: Stack) {

	}
	events(parent?: string): string[] {
		return [];
	}
	toString(): string {
		return this.comment;
	}
	toJson(): object {
		return { comment: this.comment };
	}
}
