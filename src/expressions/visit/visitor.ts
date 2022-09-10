import { expressionTypes } from '../api/deserialize/type-store.js';
import { ExpressionNode, ExpressionNodConstructor, VisitNodeType } from '../api/expression.js';

export interface VisitorControl {

	/**
	 * terminate the traversal
	 */
	abort(): void;

	// /**
	//  * indicate that the traversal need not continue any further down this subtree.
	//  */
	// traverse(): void;
};

class AbortException extends Error {

}

export type VisitorCallback = (expression: ExpressionNode, type: string, control: VisitorControl) => void;

export class ExpressionVisitor {

	private getType(node: ExpressionNode): string {
		return (node.constructor as ExpressionNodConstructor<ExpressionNode>).type;
	}

	visit(node: ExpressionNode, visitorCallback: VisitorCallback): void {
		const control: VisitorControl = {
			abort() {
				throw new AbortException('terminate');
			}
		};
		const visitNode: VisitNodeType = (expression) => {
			visitorCallback(expression, this.getType(expression), control);
			this.visitExpressionNode(expression, visitNode);
		};
		try {
			visitorCallback(node, this.getType(node), control);
			this.visitExpressionNode(node, visitNode);
		} catch (abort) {
			if (!(abort instanceof AbortException)) {
				throw abort;
			}
		}
	}

	private visitExpressionNode(node: ExpressionNode, visitNode: VisitNodeType): void {
		const classType = expressionTypes.get(this.getType(node))!;
		const visit = classType.visit;
		if (!visit) {
			return;
		}
		visit(node, visitNode);
	}

}

export const expressionVisitor = new ExpressionVisitor();
