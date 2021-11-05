import {
	Directive, DOMChild, DOMElementNode, htmlParser,
	OnDestroy, OnInit, StructuralDirective
} from '@ibyar/aurora';

import { buildExpressionNodes } from '@ibyar/core/html/expression';

@Directive({
	selector: '*red-note',
})
export class RedNoteDirective extends StructuralDirective implements OnInit, OnDestroy {

	private elements: ChildNode[] = [];
	private fragment: DocumentFragment;
	onInit(): void {
		const html = `<div class="alert alert-danger" role="alert"></div>`;
		const wrapperNode = htmlParser.toDomRootNode(html) as DOMElementNode;
		buildExpressionNodes(wrapperNode);
		wrapperNode.addChild(this.node as DOMChild);

		this.fragment = document.createDocumentFragment();
		const stack = this.directiveStack.copyStack();
		this.render.appendChildToParent(this.fragment, wrapperNode, stack, this.parentNode);
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