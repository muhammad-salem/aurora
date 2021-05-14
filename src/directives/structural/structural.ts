import { OnDestroy, OnInit, SourceFollowerCallback, StructuralDirective } from '@ibyar/core';
import { ExpressionNode, ForAwaitOfNode, JavaScriptParser, StackProvider } from '@ibyar/expressions';

export abstract class AbstractStructuralDirective<T> extends StructuralDirective<T> implements OnInit, OnDestroy {
	private elements: ChildNode[] = [];
	private fragment: DocumentFragment;

	abstract getCallback(node: ExpressionNode): () => void;
	abstract getStatement(): string;

	onInit() {
		const statement = this.getStatement();
		const node = JavaScriptParser.parse(statement);
		const callback = this.getCallback(node);
		this.renderElements(node, callback);
	}

	private renderElements(node: ExpressionNode, callback: () => void): void {
		const uiCallback: SourceFollowerCallback = (stack: any[]) => {
			stack.push(this);
			this.removeOldElements();
			this.fragment = document.createDocumentFragment();
			callback();
			this.fragment.childNodes.forEach(child => this.elements.push(child));
			this.comment.after(this.fragment);
		};
		this.render.subscribeExpressionNode(node, this.directiveStack, uiCallback);
		if (!(node instanceof ForAwaitOfNode)) {
			uiCallback([]);
		}
	}
	protected updateView(stack: StackProvider) {
		for (const child of this.directive.children) {
			this.render.appendChildToParent(this.fragment, child, stack);
		}
	}

	private removeOldElements() {
		if (this.elements.length > 0) {
			const parent: Node = this.comment.parentNode!;
			for (const elm of this.elements) {
				parent.removeChild(elm);
			}
			this.elements.splice(0);
		}
	}
	onDestroy() {
		console.log('directive destroy');
		this.removeOldElements();
	}
}
