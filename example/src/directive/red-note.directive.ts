import {
	Directive, DOMElementNode, ExpressionNode,
	htmlParser, OnDestroy, OnInit, StructuralDirective
} from '@ibyar/aurora';

import { buildExpressionNodes } from '@ibyar/core/html/expression';

@Directive({
	selector: '*red-note',
})
export class RedNoteDirective<T> extends StructuralDirective<T> implements OnInit, OnDestroy {

	private elements: ChildNode[] = [];
	private fragment: DocumentFragment;
	onInit(): void {
		const html = `<div class="alert alert-danger" role="alert"></div>`;
		const node = htmlParser.toDomRootNode(html) as DOMElementNode<ExpressionNode>;
		buildExpressionNodes(node);
		node.children = this.directive.children;

		this.fragment = document.createDocumentFragment();
		const stack = this.directiveStack.copyStack();
		this.render.appendChildToParent(this.fragment, node, stack);
		this.fragment.childNodes.forEach(child => this.elements.push(child));
		this.comment.after(this.fragment);
	}
	private removeOldElements() {
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