import { Directive, OnInit, SourceFollowerCallback, StructuralDirective } from '@ibyar/core';
import { DOMDirectiveNode, DOMElementNode } from '@ibyar/elements';
import { ExpressionNode, JavaScriptParser, ScopedStack, SwitchNode } from '@ibyar/expressions';


@Directive({
	selector: '*switch',
})
export class SwitchDirective<T> extends StructuralDirective<T> implements OnInit {

	element: HTMLElement;
	caseElements: DOMDirectiveNode<ExpressionNode>[] = [];
	caseExpressions: ExpressionNode[] = [];
	defaultElement: DOMDirectiveNode<ExpressionNode>;
	onInit(): void {
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
		const statement = this.getStatement();
		const switchNode = JavaScriptParser.parse(statement);
		for (const directive of this.caseElements) {
			this.caseExpressions.push(JavaScriptParser.parse(String(directive.directiveValue)));
		}
		let callback: () => void;
		if (switchNode instanceof SwitchNode) {
			callback = () => {
				const switchStack = this.contextStack.newStack();
				const expressionValue = switchNode.getExpression().get(switchStack);
				let child: DOMDirectiveNode<ExpressionNode> | undefined;
				for (let i = 0; i < this.caseExpressions.length; i++) {
					const value = this.caseExpressions[i].get(switchStack);
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
				this._updateView(child.children[0] as DOMElementNode<ExpressionNode>, switchStack);
			};
		} else {
			throw new Error(`syntax error: ${this.directive.directiveValue}`);
		}
		const uiCallback: SourceFollowerCallback = (stack: any[]) => {
			if (this.element) {
				this.comment.parentNode?.removeChild(this.element);
			}
			callback();
			const lastComment = new Comment(`end *switch: ${this.directive.directiveValue}`);
			this.element.after(lastComment);
			stack.push(this);
		};
		this.render.subscribeExpressionNode(switchNode, this.contextStack, uiCallback, this);
		uiCallback([]);
	}
	private getStatement() {
		return `switch(${this.directive.directiveValue}) { }`;
	}
	private _updateView(node: DOMElementNode<ExpressionNode>, stack: ScopedStack) {
		this.element = this.render.createElement(node, stack);
		this.comment.after(this.element);
	}
}
