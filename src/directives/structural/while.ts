import {
	Directive, OnInit,
	SourceFollowerCallback, StructuralDirective
} from '@ibyar/core';
import { DOMElementNode } from '@ibyar/elements';
import {
	ExpressionNode, JavaScriptParser,
	ScopedStack, StatementNode, WhileNode
} from '@ibyar/expressions';

@Directive({
	selector: '*while',
})
export class WhileDirective<T> extends StructuralDirective<T> implements OnInit {

	lastElement: HTMLElement | Comment;
	lastComment: Comment;
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
			const whileStack = this.contextStack.newStack();
			if (initializer) {
				initializer.get(whileStack);
			}
			while (condition.get(whileStack)) {
				this._updateView(whileStack);
			}
		};
		const uiCallback: SourceFollowerCallback = (stack: any[]) => {
			this.lastElement = this.comment;
			// should remove old elements
			if (this.elements.length > 0) {
				const parent: Node = this.comment.parentNode!;
				for (const elm of this.elements) {
					parent.removeChild(elm);
				}
				this.elements.splice(0);
			}
			callback();
			const lastComment = new Comment(`end *for: ${this.directive.directiveValue}`);
			this.lastElement.after(lastComment);
			this.elements.push(lastComment);
			stack.push(this);
		};
		this.render.subscribeExpressionNode(whileNode, this.contextStack, uiCallback, this);
		uiCallback([]);
	}
	private getStatement() {
		const statement = this.directive.directiveValue.trim();
		if (statement.startsWith('let')) {
			return statement;
		} else {
			return `while (${statement}) { }`;
		}
	}
	private _updateView(forStack: ScopedStack) {
		const element = this.render.createElement(this.directive.children[0] as DOMElementNode<ExpressionNode>, forStack);
		this.lastElement.after(element);
		this.elements.push(element);
		this.lastElement = element;
	}
}
