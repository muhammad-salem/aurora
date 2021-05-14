import { Directive } from '@ibyar/core';
import { ExpressionNode, ForAwaitOfNode, ForInNode, ForNode, ForOfNode } from '@ibyar/expressions';
import { AbstractStructuralDirective } from './structural.js';

@Directive({
	selector: '*for',
})
export class ForDirective<T> extends AbstractStructuralDirective<T> {

	getStatement() {
		if (/^await ?\(.*\)$/g.test(this.directive.directiveValue)) {
			return `for ${this.directive.directiveValue} { }`;
		} else if (/^await *[cl]$/g.test(this.directive.directiveValue)) {
			const statement = this.directive.directiveValue.substring(5);
			return `for await(${statement}) { }`;
		} else {
			return `for(${this.directive.directiveValue}) { }`;
		}
	}
	getCallback(forNode: ExpressionNode): () => void {
		let callback: () => void;
		if (forNode instanceof ForNode) {
			callback = this.handelForNode(forNode);
		} else if (forNode instanceof ForOfNode) {
			callback = this.handelForOfNode(forNode);
		} else if (forNode instanceof ForInNode) {
			callback = this.handelForInNode(forNode);
		} else if (forNode instanceof ForAwaitOfNode) {
			callback = this.handelForAwaitOfNode(forNode);
		} else {
			throw new Error(`syntax error: ${this.directive.directiveValue}`);
		}
		return callback;
	}

	handelForNode(forNode: ForNode) {
		return () => {
			for (
				forNode.getInitialization()?.get(this.directiveStack);
				forNode.getCondition()?.get(this.directiveStack) ?? true;
				forNode.getFinalExpression()?.get(this.directiveStack)
			) {
				// insert/remove
				this.updateView(this.directiveStack);
			}
		};
	}
	handelForOfNode(forOfNode: ForOfNode): () => void {
		return () => {
			const iterable = <any[]>forOfNode.getIterable().get(this.directiveStack);
			for (const iterator of iterable) {
				const stack = this.directiveStack.newStack();
				forOfNode.getVariable().set(stack, iterator);
				this.updateView(stack);
			}
		};
	}
	handelForInNode(forInNode: ForInNode): () => void {
		return () => {
			const iterable = <object>forInNode.getObject().get(this.directiveStack);
			for (const iterator in iterable) {
				const stack = this.directiveStack.newStack();
				forInNode.getVariable().set(stack, iterator);
				this.updateView(stack);
			}
		};
	}
	handelForAwaitOfNode(forAwaitOfNode: ForAwaitOfNode): () => void {
		return async () => {
			const iterable: AsyncIterable<any> = forAwaitOfNode.getIterable().get(this.directiveStack);
			for await (const iterator of iterable) {
				const stack = this.directiveStack.newStack();
				forAwaitOfNode.getVariable().set(stack, iterator);
				this.updateView(stack);
			}
		};
	}
}
