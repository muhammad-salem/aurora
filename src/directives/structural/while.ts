import { Directive, OnInit, SourceFollowerCallback, StructuralDirective } from '@ibyar/core';
import { ExpressionNode, JavaScriptParser, StackProvider, StatementNode, WhileNode } from '@ibyar/expressions';

@Directive({
	selector: '*while',
})
export class WhileDirective<T> extends StructuralDirective<T> implements OnInit {
	elements: ChildNode[] = [];
	onInit(): void {
		const statement = this.getStatement();
		const whileNode = JavaScriptParser.parse(statement);
		let initializer: ExpressionNode;
		let condition: ExpressionNode;
		if (whileNode instanceof StatementNode) {
			if (whileNode.getLines().length > 2) {
				throw new Error(`syntax error: ${this.directive.directiveValue}`);
			}
			initializer = whileNode.getLines()[0];
			condition = whileNode.getLines()[1];
		} else if (whileNode instanceof WhileNode) {
			condition = whileNode.getCondition();
		} else {
			throw new Error(`syntax error: ${this.directive.directiveValue}`);
		}

		const callback = () => {
			if (initializer) {
				initializer.get(this.directiveStack);
			}
			while (condition.get(this.directiveStack)) {
				this._updateView(this.directiveStack);
			}
		};
		const uiCallback: SourceFollowerCallback = (stack: any[]) => {
			stack.push(this);
			if (this.elements.length > 0) {
				const parent: Node = this.comment.parentNode!;
				for (const elm of this.elements) {
					parent.removeChild(elm);
				}
				this.elements.splice(0);
			}
			callback();
		};
		this.render.subscribeExpressionNode(whileNode, this.directiveStack, uiCallback, this);
		uiCallback([]);
	}
	private getStatement() {
		const statement = this.directive.directiveValue.toString().trim();
		if (statement.startsWith('let')) {
			return statement;
		} else {
			return `while (${statement}) { }`;
		}
	}
	private _updateView(stack: StackProvider) {
		const fragment = document.createDocumentFragment();
		for (const child of this.directive.children) {
			this.render.appendChildToParent(fragment, child, stack);
		}
		fragment.childNodes.forEach(child => this.elements.push(child));
		this.comment.after(fragment);
	}
}
