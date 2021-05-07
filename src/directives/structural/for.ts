import { Directive, OnInit, SourceFollowerCallback, StructuralDirective } from '@ibyar/core';
import { DOMElementNode } from '@ibyar/elements';
import {
	ExpressionNode, ForAwaitOfNode, ForInNode,
	ForNode, ForOfNode, JavaScriptParser, ScopedStack
} from '@ibyar/expressions';

@Directive({
	selector: '*for',
})
export class ForDirective<T> extends StructuralDirective<T> implements OnInit {

	lastElement: HTMLElement | Comment;
	lastComment: Comment;

	onInit(): void {
		const statement = this.getStatement();
		const forNode = JavaScriptParser.parse(statement);
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
		// const isNotAsync = Reflect.get(callback, Symbol.toStringTag) !== 'AsyncFunction';
		// console.log('callback[Symbol.toStringTag]', Reflect.get(callback, Symbol.toStringTag));
		const uiCallback: SourceFollowerCallback = (stack: any[]) => {
			this.lastElement = this.comment;
			// should remove old elements
			if (this.lastComment) {
				const elements: ChildNode[] = [];
				let el = this.comment.nextSibling;
				while (el && el !== this.lastComment) {
					elements.push(el);
					el = el.nextSibling;
				}
				for (const elm of elements) {
					this.comment.parentNode?.removeChild(elm);
				}
			}
			callback();
			this.lastComment = new Comment(`end *for: ${this.directive.directiveValue}`);
			this.lastElement.after(this.lastComment);
			stack.push(this);
		};
		this.render.subscribeExpressionNode(forNode, this.contextStack, uiCallback, this);
		if (!(forNode instanceof ForAwaitOfNode)) uiCallback([]);
	}
	private getStatement() {
		if (/^await ?\(.*\)$/g.test(this.directive.directiveValue)) {
			return `for ${this.directive.directiveValue} { }`;
		} else if (/^await *[cl]$/g.test(this.directive.directiveValue)) {
			const statement = this.directive.directiveValue.substring(5);
			return `for await(${statement}) { }`;
		} else {
			return `for(${this.directive.directiveValue}) { }`;
		}
	}

	handelForNode(forNode: ForNode) {
		return () => {
			const forStack = this.contextStack.newStack();
			for (
				forNode.getInitialization()?.get(forStack);
				forNode.getCondition()?.get(forStack) ?? true;
				forNode.getFinalExpression()?.get(forStack)
			) {
				// insert/remove
				this._updateView(forStack);
			}
		};
	}
	handelForOfNode(forOfNode: ForOfNode): () => void {
		return () => {
			const iterable = <any[]>forOfNode.getIterable().get(this.contextStack);
			const forOfStack = this.contextStack.newStack();
			for (const iterator of iterable) {
				forOfNode.getVariable().set(forOfStack, iterator);
				this._updateView(forOfStack);
			}
		};
	}
	handelForInNode(forInNode: ForInNode): () => void {
		return () => {
			const iterable = <object>forInNode.getObject().get(this.contextStack);
			const forInStack = this.contextStack.newStack();
			for (const iterator in iterable) {
				forInNode.getVariable().set(forInStack, iterator);
				this._updateView(forInStack);
			}
		};
	}
	handelForAwaitOfNode(forAwaitOfNode: ForAwaitOfNode): () => void {
		return async () => {
			const iterable: AsyncIterable<any> = forAwaitOfNode.getIterable().get(this.contextStack);
			const forOfStack = this.contextStack.newStack();
			for await (const iterator of iterable) {
				forAwaitOfNode.getVariable().set(forOfStack, iterator);
				this._updateView(forOfStack);
			}
		};
	}
	private _updateView(forStack: ScopedStack) {
		const element = this.render.createElement(this.directive.children[0] as DOMElementNode<ExpressionNode>, forStack);
		this.lastElement.after(element);
		this.lastElement = element;
	}
}
