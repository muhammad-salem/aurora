import type {
	NodeDeserializer, ExpressionNode, ExpressionEventPath,
	VisitNodeType, VisitNodeListType,
} from '../expression.js';
import type { Scope } from '../../scope/scope.js';
import type { Stack } from '../../scope/stack.js';
import { AbstractExpressionNode } from '../abstract.js';
import { Deserializer } from '../deserialize/deserialize.js';

@Deserializer('ExpressionStatement')
export class ExpressionStatement extends AbstractExpressionNode {
	static fromJSON(node: ExpressionStatement, deserializer: NodeDeserializer): ExpressionStatement {
		return new ExpressionStatement(node.body.map(line => deserializer(line)));
	}
	static visit(node: ExpressionStatement, visitNode: VisitNodeType, visitNodeList: VisitNodeListType): void {
		visitNodeList(node.body);
	}
	constructor(private body: ExpressionNode[]) {
		super();
	}
	getBody() {
		return this.body;
	}
	shareVariables(scopeList: Scope<any>[]): void {
		this.body.forEach(statement => statement.shareVariables(scopeList));
	}
	set(stack: Stack, value: any) {
		throw new Error(`ExpressionStatement#set() has no implementation.`);
	}
	get(stack: Stack) {
		let value;
		this.body.forEach(node => value = node.get(stack));
		return value;
	}
	dependency(computed?: true): ExpressionNode[] {
		return this.body.flatMap(exp => exp.dependency(computed));
	}
	dependencyPath(computed?: true): ExpressionEventPath[] {
		return this.body.flatMap(node => node.dependencyPath(computed));
	}
	toString(): string {
		return this.body.map(node => node.toString()).join('; ').concat(';');
	}
	toJson(): object {
		return { body: this.body.map(exp => exp.toJSON()) };
	}
}
