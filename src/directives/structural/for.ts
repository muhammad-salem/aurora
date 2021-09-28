import { Directive } from '@ibyar/core';
import {
	ExpressionNode, ForAwaitOfNode,
	ForInNode, ForNode, ForOfNode, Scope
} from '@ibyar/expressions';
import { AbstractStructuralDirective } from './structural.js';

type ForAlias = 'index' | 'count' | 'first' | 'last' | 'even' | 'odd';

/**
 * ### For Of Directive
 * *for="let user of people"
 * 
 * ### For In Directive
 * *for="let key in person1"
 *
 * ### For Await OF Directive
 * *for="await (let num of asyncIterable)"
 * 
 * ### For Loop Directive
 * *for="let index = 0; index < people.length; index++"
 *
 * ** please not that the normal syntax of `for` loop is supported by a hack scope.
 * 
 * The following exported values can be aliased to local variables:
 * - index: number: The index of the current item in the iterable.
 * - count: number: The length of the iterable.
 * - first: boolean: True when the item is the first item in the iterable.
 * - last: boolean: True when the item is the last item in the iterable.
 * - even: boolean: True when the item has an even index in the iterable.
 * - odd: boolean: True when the item has an odd index in the iterable.
 * 
 * ** `for await (...)` and `for( ...; ... ; ...)` not have value of `count` or `last`.
 * 
 * *for="let user of users; index as i; first as isFirst"
 */
@Directive({
	selector: '*for',
})
export class ForDirective<T> extends AbstractStructuralDirective<T> {

	private alias: { [key in ForAlias]?: string };
	getStatement() {
		const lines = this.directive.directiveValue.split(';');
		const forStatement = lines[0];
		if (lines.length > 1) {
			lines.splice(0, 1);
			this.alias = {};
			lines.map(line => line.split(/\s+as\s+/g))
				.map(parts => parts.map(str => str.trim()))
				.forEach(keyValue => this.alias[keyValue[0] as ForAlias] = keyValue[1]);
		}
		if (/^await ?\(.*\)$/g.test(forStatement)) {
			// await (let x of y)
			return `for ${forStatement} { }`;
		} else if (/^await *[vlc]$/g.test(forStatement)) {
			// await let x of y
			const statement = forStatement.substring(5);
			return `for await(${statement}) { }`;
		} else {
			// let x of y ==> for (const x of y) {}
			// const x in y ==> for (const x in y) {}
			// const x =0; x < y.length; x++;
			return `for(${forStatement}) { }`;
		}
	}
	getCallback(forNode: ExpressionNode): () => void | Promise<void> {
		let callback: () => void | Promise<void>;
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

	/**
	 * will remove support of normal for expression,
	 * can't handle stack in a good way
	 * @deprecated
	 * @param forNode 
	 * @returns 
	 */
	handelForNode(forNode: ForNode) {
		return () => {
			let stack = this.directiveStack.copyStack();
			let scope = stack.pushFunctionScope();
			forNode.getInit()?.get(stack);
			let index = 0;
			for (
				/** executed by common/directive stack*/;
				forNode.getTest()?.get(stack) ?? true;
				forNode.getUpdate()?.get(stack)
			) {
				this.setLocalVariables(scope, index++);
				// insert/remove
				this.updateView(stack);
				// each element child (in a for loop) should had its own stack
				const context = Object.assign({}, scope.getContext());
				stack = this.directiveStack.copyStack();
				scope = stack.pushFunctionScopeFor(context);
			}
		};
	}
	handelForOfNode(forOfNode: ForOfNode): () => void {
		return () => {
			const iterable = <any[]>forOfNode.getRight().get(this.directiveStack);
			let index = 0;
			const count = iterable.length;
			for (const iterator of iterable) {
				const stack = this.directiveStack.copyStack();
				const scope = stack.pushBlockScope();
				this.setLocalVariables(scope, index++, count);
				forOfNode.getLeft().declareVariable(stack, 'block', iterator);
				this.updateView(stack);
			}
		};
	}
	handelForInNode(forInNode: ForInNode): () => void {
		return () => {
			const iterable = <object>forInNode.getRight().get(this.directiveStack);
			let index = 0;
			const count = Object.keys(iterable).length;
			for (const iterator in iterable) {
				const stack = this.directiveStack.copyStack();
				const scope = stack.pushBlockScope();
				this.setLocalVariables(scope, index++, count);
				forInNode.getLeft().declareVariable(stack, 'block', iterator);
				this.updateView(stack);
			}
		};
	}
	handelForAwaitOfNode(forAwaitOfNode: ForAwaitOfNode): () => Promise<any> {
		return async () => {
			const asyncIterable: AsyncIterable<any> = forAwaitOfNode.getRight().get(this.directiveStack);
			let index = 0;
			for await (const iterator of asyncIterable) {
				const stack = this.directiveStack.copyStack();
				const scope = stack.pushBlockScope();
				this.setLocalVariables(scope, index++);
				forAwaitOfNode.getLeft().declareVariable(stack, 'block', iterator);
				this.updateView(stack);
			}
		};
	}
	onRender(node: ExpressionNode, callback: () => void | Promise<void>) {
		if (!(node instanceof ForAwaitOfNode)) {
			this.renderDOMChild(node, callback);
		} else {
			this.renderAwaitDOMChild(node, callback as () => Promise<void>);
		}
	}
	private setLocalVariables(scope: Scope<any>, index: number, count?: number) {
		if (!this.alias) {
			return;
		}
		this.alias.index && scope.set(this.alias.index, index);
		this.alias.odd && scope.set(this.alias.odd, (index % 2) == 1);
		this.alias.even && scope.set(this.alias.even, (index % 2) == 0);
		this.alias.first && scope.set(this.alias.first, index == 0);

		if (typeof count === 'number') {
			this.alias.count && scope.set(this.alias.count, count);
			this.alias.last && scope.set(this.alias.last, index === count - 1);
		}
	}
}
