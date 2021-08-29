import { Directive } from '@ibyar/core';
import { ExpressionNode, IfElseNode } from '@ibyar/expressions';
import { DOMElementNode } from '@ibyar/elements';
import { AbstractStructuralDirective } from './structural.js';


@Directive({
	selector: '*if',
})
export class IfDirective<T> extends AbstractStructuralDirective<T> /*implements OnInit */ {
	lastTest: boolean;
	elseTemplateNode: DOMElementNode<ExpressionNode> | undefined;
	getStatement(): string {
		const [test, alternate] = this.directive.directiveValue.toString().split(/[ \t]{0,};{0,}[ \t]{0,}else[ \t]{1,}/g);
		if (alternate) {
			return `if(${test}) { } else '${alternate}'`;
		}
		return `if(${test}) { }`;
	}
	getCallback(ifNode: IfElseNode): () => void {
		const alternate = ifNode.getAlternate();
		if (alternate) {
			const elseTemplateName: string = alternate.get(this.directiveStack);
			this.elseTemplateNode = this.findTemplate(elseTemplateName, this.render.template);
		}
		return () => {
			const stack = this.directiveStack.copyStack();
			stack.pushBlockScope();
			const test = ifNode.getTest().get(stack);
			if (test !== this.lastTest) {
				this.lastTest = test;
				if (test) {
					this.appendChildToParent(this.directive.children, stack);
				} else if (this.elseTemplateNode) {
					this.appendChildToParent(this.elseTemplateNode.children, stack);
				}
			}
		};
	}
}
