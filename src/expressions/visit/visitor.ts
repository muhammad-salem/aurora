import { expressionTypes } from '../api/deserialize/type-store.js';
import { ExpressionNode, NodeExpressionWithType, VisitNodeListType, VisitNodeType } from '../api/expression.js';

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
		return (node.constructor as NodeExpressionWithType<ExpressionNode>).type;
	}

	visit(node: ExpressionNode, visitorCallback: VisitorCallback): void {
		const control: VisitorControl = {
			abort() {
				throw new AbortException('terminate');
			}
		};
		const visitNode: VisitNodeType = (expression) => {
			visitorCallback(expression, this.getType(expression), control);

			this.visitExpressionNode(expression, visitNode, visitNodeList);

		};
		const visitNodeList: VisitNodeListType = (expressions) => {
			expressions.forEach(visitNode);
		};
		try {
			visitorCallback(node, this.getType(node), control);
			this.visitExpressionNode(node, visitNode, visitNodeList);
		} catch (abort) {
			if (!(abort instanceof AbortException)) {
				throw abort;
			}
		}
	}

	private visitExpressionNode(node: ExpressionNode, visitNode: VisitNodeType, visitNodeList: VisitNodeListType): void {
		const classType = expressionTypes.get(this.getType(node))!;
		const visit = classType.visit;
		if (!visit) {
			return;
		}
		visit(node, visitNode, visitNodeList);
	}

}

export const expressionVisitor = new ExpressionVisitor();
