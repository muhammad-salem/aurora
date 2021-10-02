
import type { NodeDeserializer, ExpressionNode, CanDeclareExpression } from '../../expression.js';
import type { Scope } from '../../../scope/scope.js';
import type { Stack } from '../../../scope/stack.js';
import type { ScopeType } from '../../../scope/scope.js';
import { AbstractExpressionNode, AwaitPromise } from '../../abstract.js';
import { Deserializer } from '../../deserialize/deserialize.js';

@Deserializer('VariableDeclarator')
export class VariableNode extends AbstractExpressionNode implements CanDeclareExpression {
	static fromJSON(node: VariableNode, deserializer: NodeDeserializer): VariableNode {
		return new VariableNode(
			deserializer(node.id) as CanDeclareExpression,
			node.init ? deserializer(node.id) : void 0
		);
	}
	constructor(public id: CanDeclareExpression, public init?: ExpressionNode) {
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
		this.declareVariable(stack, 'block');
	}
	declareVariable(stack: Stack, scopeType: ScopeType, propertyValue?: any) {
		if (propertyValue !== undefined) {
			this.id.declareVariable(stack, scopeType, propertyValue);
			return;
		}
		const value = this.init?.get(stack);
		if (value instanceof AwaitPromise) {
			value.node = this.id;
			value.declareVariable = true;
			value.scopeType = scopeType;
			value.node.declareVariable(stack, scopeType);
			stack.resolveAwait(value);
		} else {
			this.id.declareVariable(stack, scopeType, value);
		}
	}
	events(parent?: string): string[] {
		return [];
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
export class VariableDeclarationNode extends AbstractExpressionNode implements CanDeclareExpression {
	static fromJSON(node: VariableDeclarationNode, deserializer: NodeDeserializer): VariableDeclarationNode {
		return new VariableDeclarationNode(
			node.declarations.map(deserializer) as VariableNode[],
			node.kind
		);
	}
	constructor(protected declarations: VariableNode[], protected kind: 'var' | 'let' | 'const') {
		super();
	}
	getDeclarations() {
		return this.declarations;
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
			item.declareVariable(stack, this.kind === 'var' ? 'function' : 'block');
		}
	}
	declareVariable(stack: Stack, scopeType: ScopeType, propertyValue: any): any {
		this.declarations[0].declareVariable(stack, this.kind === 'var' ? 'function' : 'block', propertyValue);
	}
	events(parent?: string): string[] {
		return this.declarations.flatMap(v => v.events());
	}
	toString(): string {
		return `${this.kind} ${this.declarations.map(v => v.toString()).join(', ')}`;
	}
	toJson(): object {
		return {
			kind: this.kind,
			declarations: this.declarations.map(v => v.toJSON()),
		};
	}
}
