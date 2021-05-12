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

	elements: ChildNode[] = [];

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

		const uiCallback: SourceFollowerCallback = (stack: any[]) => {
			this.lastElement = this.comment;
			// should remove old elements
			if (this.elements.length > 0) {
				const parent: Node = this.comment.parentNode!;
				for (const elm of this.elements) {
					parent.removeChild(elm);
				}
				this.elements.splice(0);
			}
			callback();
			stack.push(this);
		};
		this.render.subscribeExpressionNode(forNode, this.directiveStack, uiCallback, this);
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
			for (
				forNode.getInitialization()?.get(this.directiveStack);
				forNode.getCondition()?.get(this.directiveStack) ?? true;
				forNode.getFinalExpression()?.get(this.directiveStack)
			) {
				// insert/remove
				this._updateView(this.directiveStack);
			}
		};
	}
	handelForOfNode(forOfNode: ForOfNode): () => void {
		return () => {
			const iterable = <any[]>forOfNode.getIterable().get(this.directiveStack);
			for (const iterator of iterable) {
				const stack = this.directiveStack.newStack();
				forOfNode.getVariable().set(stack, iterator);
				this._updateView(stack);
			}
		};
	}
	handelForInNode(forInNode: ForInNode): () => void {
		return () => {
			const iterable = <object>forInNode.getObject().get(this.directiveStack);
			for (const iterator in iterable) {
				const stack = this.directiveStack.newStack();
				forInNode.getVariable().set(stack, iterator);
				this._updateView(stack);
			}
		};
	}
	handelForAwaitOfNode(forAwaitOfNode: ForAwaitOfNode): () => void {
		return async () => {
			const iterable: AsyncIterable<any> = forAwaitOfNode.getIterable().get(this.directiveStack);
			for await (const iterator of iterable) {
				const stack = this.directiveStack.newStack();
				forAwaitOfNode.getVariable().set(stack, iterator);
				this._updateView(stack);
			}
		};
	}
	private _updateView(forStack: ScopedStack) {
		const element = this.render.createElement(this.directive.children[0] as DOMElementNode<ExpressionNode>, forStack);
		this.lastElement.after(element);
		this.elements.push(element);
		this.lastElement = element;
	}
}
