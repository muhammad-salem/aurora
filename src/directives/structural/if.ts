import { Directive, OnInit, SourceFollowerCallback, StructuralDirective } from '@ibyar/core';
import { JavaScriptParser } from '@ibyar/expressions';


@Directive({
	selector: '*if',
})
export class IfDirective<T> extends StructuralDirective<T> implements OnInit {

	children: Array<ChildNode>;

	onInit(): void {
		const fragment = document.createDocumentFragment();
		for (const child of this.directive.children) {
			this.render.appendChildToParent(fragment, child, this.directiveStack);
		}
		this.children = [];
		fragment.childNodes.forEach(child => this.children!.push(child));

		const conditionNode = JavaScriptParser.parse(this.directive.directiveValue.toString());
		let lastConditionValue = false;
		const callback: SourceFollowerCallback = (stackTrace: any[]) => {
			stackTrace.push(this);
			const stack = this.directiveStack.copyStack();
			stack.pushBlockScope();
			const condition = conditionNode.get(stack);
			if (lastConditionValue !== condition) {
				lastConditionValue = condition;
				this._updateView(condition);
			}
		};

		this.render.subscribeExpressionNode(conditionNode, this.directiveStack, callback, this);
		callback([]);
	}

	private _updateView(condition: boolean) {
		if (condition) {
			let last: ChildNode = this.comment;
			this.children.forEach(child => {
				last.after(child);
				last = child;
			});
		}
		else if (this.children) {
			this.children.forEach(child => child.remove());
		}
	}

}
