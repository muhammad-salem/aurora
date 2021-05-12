import { DOMElementNode } from '@ibyar/elements';
import { Directive, OnInit, SourceFollowerCallback, StructuralDirective } from '@ibyar/core';
import { ExpressionNode, JavaScriptParser } from '@ibyar/expressions';


@Directive({
	selector: '*if',
})
export class IfDirective<T> extends StructuralDirective<T> implements OnInit {

	element: HTMLElement;

	onInit(): void {
		this.element = this.render.createElement(this.directive.children[0] as DOMElementNode<ExpressionNode>, this.directiveStack);
		const conditionNode = JavaScriptParser.parse(this.directive.directiveValue);
		let lastConditionValue = false;
		const callback: SourceFollowerCallback = (stack: any[]) => {
			const condition = conditionNode.get(this.directiveStack);
			if (lastConditionValue !== condition) {
				this._updateView(condition);
			}
			lastConditionValue = condition;
			stack.push(this);
		};
		this.render.subscribeExpressionNode(conditionNode, this.directiveStack, callback, this);
		callback([]);
	}

	private _updateView(condition: boolean) {
		if (condition) {
			this.comment.after(this.element);
		}
		else if (this.element) {
			this.element.remove();
		}
	}

}
