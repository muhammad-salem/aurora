import { DeclarationExpression, ExpressionNode } from './expression.js';

export interface TypeOf<T> {
	new(...params: any[]): T;
}


export function isDeclarationExpression(node: ExpressionNode): node is DeclarationExpression {
	return typeof (node as any).declareVariable === 'function';
}
