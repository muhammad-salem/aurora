import type { ExpressionNode, NodeExpressionWithType, VisitNodeListType, VisitNodeType } from '../expression.js';

const DeserializerMap: Map<string, NodeExpressionWithType<ExpressionNode>> = new Map();


export function Deserializer(type: string): Function {
	return (target: NodeExpressionWithType<ExpressionNode>) => {
		Reflect.set(target, 'type', type)
		DeserializerMap.set(type, target);
		return target;
	};
}

export function serializeNode(node: ExpressionNode) {
	return JSON.stringify(node);
}


/**
 * convert from json expression `JSON.stringify(node)` or `serializeNode` to `ExpressionNode`
 * @param node as type `NodeJsonType`
 * @returns ExpressionNode
 */
export function deserialize(node: ExpressionNode) {
	const fromJSON = DeserializerMap.get((<any>node).type)?.fromJSON;
	if (fromJSON) {
		return fromJSON(node, deserialize);
	} else {
		throw new Error(`Couldn't find Expression class for name: ${JSON.stringify(node)}.`);
	}
}

export function deserializeNode(node: string) {
	const exp = JSON.parse(node);
	return deserialize(exp);
}

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
		return DeserializerMap.get(this.getType(node))!.type;
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
		const classType = DeserializerMap.get(this.getType(node))!;
		const visit = classType.visit;
		if (!visit) {
			return;
		}
		visit(node, visitNode, visitNodeList);
	}

}

export const expressionVisitor = new ExpressionVisitor();
