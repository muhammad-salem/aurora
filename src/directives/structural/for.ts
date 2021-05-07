import {
	Directive, OnInit, SourceFollowerCallback,
	StructuralDirective, subscribe1way
} from '@ibyar/core';
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
		let callback: SourceFollowerCallback;
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
		this.render.subscribeExpressionNode(forNode, this.contextStack, callback, this);
		callback([]);
	}
	private getStatement() {
		if (/^await ?\(.*\)$/g.test(this.directive.directiveValue)) {
			return `for${this.directive.directiveValue} { }`;
		} else if (/^await *[cl]$/g.test(this.directive.directiveValue)) {
			const statement = this.directive.directiveValue.substring(5);
			return `for await(${statement}) { }`;
		} else {
			return `for(${this.directive.directiveValue}) { }`;
		}
	}

	handelForNode(forNode: ForNode): SourceFollowerCallback {
		const callback: SourceFollowerCallback = (stack: any[]) => {
			const forStack = this.contextStack.newStack();
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
			for (
				forNode.getInitialization()?.get(forStack);
				forNode.getCondition()?.get(forStack) ?? true;
				forNode.getFinalExpression()?.get(forStack)
			) {
				// insert/remove
				this._updateView(forStack);
			}
			this.lastComment = new Comment(`end *for: ${this.directive.directiveValue}`);
			this.lastElement.after(this.lastComment);
			stack.push(this);
		};
		return callback;
	}
	handelForOfNode(forNode: ForOfNode): SourceFollowerCallback {
		throw new Error('Method not implemented.');
	}
	handelForInNode(forNode: ForInNode): SourceFollowerCallback {
		throw new Error('Method not implemented.');
	}
	handelForAwaitOfNode(forNode: ForAwaitOfNode): SourceFollowerCallback {
		throw new Error('Method not implemented.');
	}
	private _updateView(forStack: ScopedStack) {
		const element = this.render.createElement(this.directive.children[0] as DOMElementNode<ExpressionNode>, forStack);
		this.lastElement.after(element);
		this.lastElement = element;
	}
}
