import {
	Directive, DOMChild, DOMNode, htmlParser,
	OnDestroy, OnInit, Stack, StructuralDirective
} from '@ibyar/aurora';

import { buildExpressionNodes } from '@ibyar/core/html/expression';

@Directive({
	selector: '*add-note',
})
export class AddNoteDirective extends StructuralDirective implements OnInit, OnDestroy {

	private elements: ChildNode[] = [];
	private fragment: DocumentFragment;
	onInit(): void {
		const html = `<div class="alert alert-success" role="alert">structural directive name: '{{directiveName}}'</div>`;
		const wrapperNode: DOMNode = htmlParser.toDomRootNode(html);
		buildExpressionNodes(wrapperNode);
		const children: DOMNode[] = [wrapperNode, this.node];

		this.fragment = document.createDocumentFragment();
		const stack = this.directiveStack.copyStack();
		stack.pushBlockScopeFor({
			directiveName: '*add-note'
		});
		this.appendChildToParent(children, stack);
		this.fragment.childNodes.forEach(child => this.elements.push(child));
		this.comment.after(this.fragment);
	}
	protected appendChildToParent(children: DOMNode[], stack: Stack) {
		for (const child of children) {
			this.render.appendChildToParent(this.fragment, child, stack, this.parentNode);
		}
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