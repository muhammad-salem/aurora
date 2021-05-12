import { DOMElementNode } from '@ibyar/elements';
import { Directive, OnInit, SourceFollowerCallback, StructuralDirective } from '@ibyar/core';
import { ExpressionNode, JavaScriptParser } from '@ibyar/expressions';


@Directive({
	selector: '*if',
})
export class IfDirective<T> extends StructuralDirective<T> implements OnInit {

	element: HTMLElement | undefined;

	onInit(): void {
		const conditionNode = JavaScriptParser.parse(this.directive.directiveValue);

		const callback: SourceFollowerCallback = (stack: any[]) => {
			const condition = conditionNode.get(this.directiveStack);
			this._updateView(condition);
			stack.push(this);
		};

		this.render.subscribeExpressionNode(conditionNode, this.directiveStack, callback, this);
		callback([]);
	}

	private _updateView(condition: boolean) {
		if (condition) {
			if (!this.element) {
				this.element = this.render.createElement(this.directive.children[0] as DOMElementNode<ExpressionNode>, this.directiveStack);
				this.comment.after(this.element);
			}
		}
		else if (this.element) {
			this.element.remove();
			this.element = undefined;
		}
	}

}
