import type {
	ExpressionEventPath, ExpressionNode,
	NodeDeserializer, VisitNodeType
} from '../expression.js';
import type { Scope } from '../../scope/scope.js';
import type { Stack } from '../../scope/stack.js';
import { AbstractExpressionNode } from '../abstract.js';
import { Deserializer } from '../deserialize/deserialize.js';

@Deserializer('ModuleExpression')
export class ModuleExpression extends AbstractExpressionNode {
	static fromJSON(node: ModuleExpression, deserializer: NodeDeserializer): ModuleExpression {
		return new ModuleExpression(
			node.exportList.map(deserializer),
			node.importList.map(deserializer),
			node.body.map(deserializer),
			node.meta
		);
	}
	static visit(node: ModuleExpression, visitNode: VisitNodeType): void {
		node.exportList.forEach(visitNode);
		node.importList.forEach(visitNode);
		node.body.forEach(visitNode);
	}
	constructor(
		private exportList: ExpressionNode[],
		private importList: ExpressionNode[],
		private body: ExpressionNode[],
		private meta: { name: string, url: string, }) {
		super();
	}
	getExportList() {
		return this.exportList;
	}
	getImportList() {
		return this.importList;
	}
	getBody() {
		return this.body;
	}
	shareVariables(scopeList: Scope<any>[]): void { }
	set(stack: Stack) {
		throw new Error(`ModuleNode.#set() has no implementation.`);
	}
	get(stack: Stack) {
		throw new Error(`ModuleNode.#get() has no implementation.`);
	}
	dependency(computed?: true): ExpressionNode[] {
		return this.body.flatMap(exp => exp.dependency(computed));
	}
	dependencyPath(computed?: true): ExpressionEventPath[] {
		return this.body.flatMap(exp => exp.dependencyPath(computed));
	}
	toString(): string {
		const importString = this.importList.map(imp => imp.toString()).join('\n');
		const exportString = this.exportList.map(expo => expo.toString()).join('\n');
		const bodyString = this.body.map(exp => exp.toString()).join('\n');
		return `${importString}\n${exportString}\n${bodyString}\n`;
	}
	toJson(): object {
		return {
			exportList: this.exportList.map(expression => expression.toJSON()),
			importList: this.importList.map(expression => expression.toJSON()),
			body: this.body.map(expression => expression.toJSON()),
			meta: JSON.parse(JSON.stringify(this.meta)),
		};
	}
}
