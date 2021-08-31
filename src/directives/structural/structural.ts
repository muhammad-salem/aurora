import { OnDestroy, OnInit, SourceFollowerCallback, StructuralDirective } from '@ibyar/core';
import { ExpressionNode, JavaScriptParser, Stack } from '@ibyar/expressions';
import { DOMChild } from '@ibyar/elements';

export abstract class AbstractStructuralDirective<T> extends StructuralDirective<T> implements OnInit, OnDestroy {
	protected elements: ChildNode[] = [];
	protected fragment: DocumentFragment;
	abstract getStatement(): string;
	abstract getCallback(node: ExpressionNode): () => void | Promise<void>;

	onInit() {
		const statement = this.getStatement();
		const node = JavaScriptParser.parse(statement);
		const callback = this.getCallback(node);
		this.onRender(node, callback);
	}
	protected onRender(node: ExpressionNode, callback: () => void) {
		this.renderDOMChild(node, callback);
	}
	protected renderDOMChild(node: ExpressionNode, callback: () => void): void {
		const uiCallback: SourceFollowerCallback = (stack: any[]) => {
			stack.push(this);
			this.removeOldElements();
			this.fragment = document.createDocumentFragment();
			callback();
			this.fragment.childNodes.forEach(child => this.elements.push(child));
			this.comment.after(this.fragment);
		};
		this.render.subscribeExpressionNode(node, this.directiveStack, uiCallback, this);
		uiCallback([]);
	}

	protected renderAwaitDOMChild(node: ExpressionNode, callback: () => Promise<void>): void {
		let promise: Promise<void> | undefined;
		const uiCallback: SourceFollowerCallback = (stack: any[]) => {
			if (promise) {
				promise.then(() => {
					// prepare for another call
					uiCallback(stack);
				});
				return;
			}
			stack.push(this);
			this.removeOldElements();
			this.fragment = document.createDocumentFragment();
			promise = callback();
			promise.then(() => {
				this.fragment.childNodes.forEach(child => this.elements.push(child));
				this.comment.after(this.fragment);
				promise = undefined;
			});
		};
		this.render.subscribeExpressionNode(node, this.directiveStack, uiCallback, this);
		uiCallback([]);
	}
	protected updateView(stack: Stack) {
		this.appendChildToParent(this.directive.children, stack);
	}
	protected appendChildToParent(children: DOMChild<ExpressionNode>[], stack: Stack) {
		for (const child of children) {
			this.render.appendChildToParent(this.fragment, child, stack);
		}
	}
	protected removeOldElements() {
		if (this.elements.length > 0) {
			for (const elm of this.elements) {
				elm.remove();
			}
			this.elements.splice(0);
		}
	}
	onDestroy() {
		this.removeOldElements();
	}
}
