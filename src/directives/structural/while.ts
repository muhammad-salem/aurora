import { Directive } from '@ibyar/core';
import { ExpressionNode, ExpressionStatement, WhileNode } from '@ibyar/expressions';
import { AbstractStructuralDirective } from './structural.js';

/**
 * While Directive Syntax
 * *while="let index = 0; index < people.length"
 * 
 */
@Directive({
	selector: '*while',
})
export class WhileDirective extends AbstractStructuralDirective {

	getStatement() {
		const statement = this.directiveValue.toString().trim();
		if (statement.startsWith('let')) {
			return statement;
		} else {
			return `while (${statement}) { }`;
		}
	}

	/**
	 * @deprecated will not support, normal while, can't handle stack in a good wat
	 * use `let; condition` syntax instead
	 * @param whileNode 
	 * @returns 
	 */
	getCallback(whileNode: ExpressionNode): () => void {
		let initializer: ExpressionNode;
		let condition: ExpressionNode;
		if (whileNode instanceof ExpressionStatement) {
			if (whileNode.getBody().length > 2) {
				throw new Error(`syntax error: ${this.directiveValue}`);
			}
			initializer = whileNode.getBody()[0];
			condition = whileNode.getBody()[1];
		} else if (whileNode instanceof WhileNode) {
			condition = whileNode.getTest();
		} else {
			throw new Error(`syntax error: ${this.directiveValue}`);
		}
		this.directiveStack.pushFunctionScope();
		const callback = () => {
			if (initializer) {
				initializer.get(this.directiveStack);
			}
			while (condition.get(this.directiveStack)) {
				this.updateView(this.directiveStack);
			}
		};
		return callback;
	}
}
