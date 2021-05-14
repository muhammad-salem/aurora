import { Directive, OnInit, SourceFollowerCallback, StructuralDirective } from '@ibyar/core';
import { DOMChild, DOMDirectiveNode } from '@ibyar/elements';
import { ExpressionNode, JavaScriptParser, StackProvider, SwitchNode } from '@ibyar/expressions';
import { AbstractStructuralDirective } from './structural.js';


@Directive({
	selector: '*case',
})
@Directive({
	selector: '*default',
})
export class DefaultSwitchCaseDirective {

}

@Directive({
	selector: '*switch',
})
export class SwitchDirective<T> extends AbstractStructuralDirective<T> {
	caseElements: DOMDirectiveNode<ExpressionNode>[] = [];
	caseExpressions: ExpressionNode[] = [];
	defaultElement: DOMDirectiveNode<ExpressionNode>;

	getStatement() {
		return `switch(${this.directive.directiveValue}) { }`;
	}
	getCallback(switchNode: ExpressionNode): () => void {
		const directiveChildren = (this.directive.children as DOMDirectiveNode<ExpressionNode>[])[0].children as DOMDirectiveNode<ExpressionNode>[];
		for (const child of directiveChildren) {
			if (child.directiveName === '*case') {
				this.caseElements.push(child);
			} else if (child.directiveName === '*default') {
				if (this.defaultElement) {
					throw new Error(`syntax error: multiple default directive in switch case ${this.directive.directiveValue}`);
				}
				this.defaultElement = child;
			}
		}
		for (const directive of this.caseElements) {
			this.caseExpressions.push(JavaScriptParser.parse(String(directive.directiveValue)));
		}
		let callback: () => void;
		if (switchNode instanceof SwitchNode) {
			callback = () => {
				const expressionValue = switchNode.getExpression().get(this.directiveStack);
				let child: DOMDirectiveNode<ExpressionNode> | undefined;
				for (let i = 0; i < this.caseExpressions.length; i++) {
					const value = this.caseExpressions[i].get(this.directiveStack);
					if (value === expressionValue) {
						child = this.caseElements[i];
						break;
					}
				}
				if (!child) {
					if (this.defaultElement) {
						child = this.defaultElement;
					} else {
						return;
					}
				}
				this._updateSwitchCaseView(child.children, this.directiveStack);
			};
		} else {
			throw new Error(`syntax error: ${this.directive.directiveValue}`);
		}
		return callback;
	}
	private _updateSwitchCaseView(children: DOMChild<ExpressionNode>[], stack: StackProvider) {
		const fragment = document.createDocumentFragment();
		for (const child of children) {
			this.render.appendChildToParent(fragment, child, stack);
		}
	}
}
