import { Directive, SourceFollowerCallback } from '@ibyar/core';
import { ExpressionNode, IfStatement, JavaScriptParser } from '@ibyar/expressions';
import { DOMElementNode } from '@ibyar/elements';
import { AbstractStructuralDirective } from './structural.js';


const FIRST_STATUE = {};

@Directive({
	selector: '*if',
})
export class IfDirective<T> extends AbstractStructuralDirective<T> {
	lastTest: boolean = FIRST_STATUE as boolean;
	elseTemplateNode: DOMElementNode<ExpressionNode> | undefined;
	getStatement(): string {
		const [test, alternate] = this.directive.directiveValue.toString().split(/[ \t]{0,};{0,}[ \t]{0,}else[ \t]{1,}/g);
		if (alternate) {
			return `if(${test}) { } else '${alternate}'`;
		}
		return `if(${test}) { }`;
	}
	onInit() {
		const statement = this.getStatement();
		const ifNode = JavaScriptParser.parse(statement) as IfStatement;
		const alternate = ifNode.getAlternate();
		if (alternate) {
			const elseTemplateName: string = alternate.get(this.directiveStack);
			this.elseTemplateNode = this.findTemplate(elseTemplateName);
		}
		const uiCallback: SourceFollowerCallback = (stackTrace: any[]) => {
			stackTrace.push(this);
			const test = ifNode.getTest().get(this.directiveStack);
			if (this.lastTest !== test) {
				this.lastTest = test;
				this.removeOldElements();
				this.fragment = document.createDocumentFragment();
				const stack = this.directiveStack.copyStack();
				stack.pushBlockScope();
				if (test) {
					this.appendChildToParent(this.directive.children, stack);
				} else if (this.elseTemplateNode) {
					this.appendChildToParent(this.elseTemplateNode.children, stack);
				}
				this.fragment.childNodes.forEach(child => this.elements.push(child));
				this.comment.after(this.fragment);
			}
		};
		this.render.subscribeExpressionNode(ifNode, this.directiveStack, uiCallback, this);
		uiCallback([]);
	}
	getCallback(node: ExpressionNode): () => void {
		throw new Error('Method not implemented.');
	}
}
