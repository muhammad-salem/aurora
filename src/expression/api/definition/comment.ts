import { AbstractExpressionNode } from '../abstract.js';
import { Deserializer } from '../deserialize/deserialize.js';
import { ScopedStack } from '../scope.js';

@Deserializer('comment')
export class CommentNode extends AbstractExpressionNode {
	static KEYWORDS = ['//', '/**/'];
	static fromJSON(nodeExp: CommentNode): CommentNode {
		return new CommentNode(nodeExp.comment);
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
	set(stack: ScopedStack, ...values: any[]) {

	}

	/**
	 * used when define a function
	 * @param context execution stack/scope context
	 */
	get(stack: ScopedStack) {

	}

	entry(): string[] {
		return [];
	}

	event(parent?: string): string[] {
		return [];
	}

	toString(): string {
		return this.comment;
	}

	toJson(): object {
		return { comment: this.comment };
	}

}
