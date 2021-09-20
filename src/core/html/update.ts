import { ExpressionNode, InfixExpressionNode, Stack } from '@ibyar/expressions';

export class NodeAssignmentExpression extends InfixExpressionNode<':=:'> {
	constructor(left: ExpressionNode, right: ExpressionNode) {
		super(':=:', left, right);
	}
	set(stack: Stack, value: any) {
		return this.left.set(stack, value);
	}
	get(stack: Stack): any {
		const lv = this.left.get(stack);
		const rv = this.right.get(stack);
		if (lv !== rv) {
			this.set(stack, rv);
		}
		return rv;
	}
}

export class TextNodeAssignmentExpression extends NodeAssignmentExpression {

}

export class HTMLNodeAssignmentExpression extends NodeAssignmentExpression {

}

export class DirectiveNodeAssignmentExpression extends NodeAssignmentExpression {

}

