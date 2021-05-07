import { DOMElementNode } from '@ibyar/elements';
import { Directive, OnInit, SourceFollowerCallback, StructuralDirective } from '@ibyar/core';
import { ExpressionNode, JavaScriptParser, ScopedStack } from '@ibyar/expressions';


@Directive({
	selector: '*if',
})
export class IfDirective<T> extends StructuralDirective<T> implements OnInit {

	condition: boolean;
	element: HTMLElement;

	ifStack: ScopedStack;

	onInit(): void {
		const conditionNode = JavaScriptParser.parse(this.directive.directiveValue);

		this.ifStack = this.contextStack.newStack();
		const callback: SourceFollowerCallback = (stack: any[]) => {
			this.condition = conditionNode.get(this.ifStack);
			this._updateView();
			stack.push(this);
		};

		this.render.subscribeExpressionNode(conditionNode, this.ifStack, callback, this);
		callback([]);
	}

	private _updateView() {
		if (this.condition) {
			if (!this.element) {
				this.element = this.render.createElement(this.directive.children[0] as DOMElementNode<ExpressionNode>, this.ifStack);
				this.comment.after(this.element);
			}
		}
		else if (this.element) {
			this.element.remove();
			Reflect.set(this, 'element', undefined);
		}
	}

}
