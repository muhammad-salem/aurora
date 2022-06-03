
import type {
	NodeDeserializer, ExpressionNode, DeclarationExpression,
	ExpressionEventPath, VisitNodeType
} from '../../expression.js';
import type { Scope } from '../../../scope/scope.js';
import type { Stack } from '../../../scope/stack.js';
import { AbstractExpressionNode, AwaitPromise } from '../../abstract.js';
import { Deserializer } from '../../deserialize/deserialize.js';

@Deserializer('VariableDeclarator')
export class VariableDeclarator extends AbstractExpressionNode implements DeclarationExpression {
	static fromJSON(node: VariableDeclarator, deserializer: NodeDeserializer): VariableDeclarator {
		return new VariableDeclarator(
			deserializer(node.id) as DeclarationExpression,
			node.init ? deserializer(node.init) : void 0
		);
	}
	static visit(node: VariableDeclarator, visitNode: VisitNodeType): void {
		visitNode(node.id);
		node.init && visitNode(node.init);
	}
	constructor(public id: DeclarationExpression, public init?: ExpressionNode) {
		super();
	}
	getId() {
		return this.id;
	}
	getInit() {
		return this.init;
	}
	shareVariables(scopeList: Scope<any>[]): void {
		this.init?.shareVariables(scopeList);
	}
	set(stack: Stack, value: any) {
		throw new Error(`VariableNode#set() has no implementation.`);
	}
	get(stack: Stack) {
		this.declareVariable(stack);
	}
	declareVariable(stack: Stack, propertyValue?: any) {
		if (propertyValue !== undefined) {
			this.id.declareVariable(stack, propertyValue);
			return;
		}
		const value = this.init?.get(stack);
		if (value instanceof AwaitPromise) {
			value.node = this.id;
			value.declareVariable = true;
			value.node.declareVariable(stack);
			stack.resolveAwait(value);
		} else {
			this.id.declareVariable(stack, value);
		}
	}
	getDeclarationName(): string {
		return this.id.getDeclarationName!();
	}
	dependency(computed?: true): ExpressionNode[] {
		return this.init?.dependency() || [];
	}
	dependencyPath(computed?: true): ExpressionEventPath[] {
		return this.init?.dependencyPath(computed) || [];
	}
	toString() {
		return `${this.id.toString()}${this.init ? ` = ${this.init.toString()}` : ''}`;
	}
	toJson() {
		return {
			id: this.id.toJSON(),
			init: this.init?.toJSON()
		};
	}
}

@Deserializer('VariableDeclaration')
export class VariableDeclarationNode extends AbstractExpressionNode implements DeclarationExpression {
	static fromJSON(node: VariableDeclarationNode, deserializer: NodeDeserializer): VariableDeclarationNode {
		return new VariableDeclarationNode(
			node.declarations.map(deserializer) as VariableDeclarator[],
			node.kind
		);
	}
	static visit(node: VariableDeclarationNode, visitNode: VisitNodeType): void {
		node.declarations.forEach(visitNode);
	}
	constructor(protected declarations: VariableDeclarator[], protected kind: 'var' | 'let' | 'const') {
		super();
	}
	getDeclarations() {
		return this.declarations;
	}
	getKind() {
		return this.kind;
	}
	shareVariables(scopeList: Scope<any>[]): void {
		this.declarations.forEach(declaration => declaration.shareVariables(scopeList));
	}
	set(stack: Stack, value: any) {
		if (Array.isArray(value)) {
			throw new Error(`VariableDeclarationNode#set() has no implementation.`);
		}
		this.declarations[0].id.set(stack, value);
	}
	get(stack: Stack) {
		for (const item of this.declarations) {
			item.declareVariable(stack);
		}
	}
	getDeclarationName(): string {
		return this.declarations[0].getDeclarationName!();
	}
	declareVariable(stack: Stack, propertyValue: any): any {
		this.declarations[0].declareVariable(stack, propertyValue);
	}
	dependency(computed?: true): ExpressionNode[] {
		return this.declarations.flatMap(declareVariable => declareVariable.dependency(computed));
	}
	dependencyPath(computed?: true): ExpressionEventPath[] {
		return this.declarations.flatMap(declareVariable => declareVariable.dependencyPath(computed));
	}
	toString(): string {
		return `${this.kind} ${this.declarations.map(v => v.toString()).join(', ')};`;
	}
	toJson(): object {
		return {
			kind: this.kind,
			declarations: this.declarations.map(v => v.toJSON()),
		};
	}
}
