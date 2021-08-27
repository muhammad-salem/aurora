
import type { NodeDeserializer, ExpressionNode, CanDeclareVariable } from '../../expression.js';
import type { AwaitPromiseInfoNode, Stack } from '../../../scope/stack.js';
import type { ScopeType } from '../../../scope/scope.js';
import { AbstractExpressionNode, AwaitPromise } from '../../abstract.js';
import { Deserializer } from '../../deserialize/deserialize.js';

@Deserializer('VariableDeclarator')
export class VariableNode extends AbstractExpressionNode implements CanDeclareVariable {
	constructor(public id: ExpressionNode, public init?: ExpressionNode) {
		super();
	}
	getId() {
		return this.id;
	}
	getInit() {
		return this.init;
	}
	set(stack: Stack, value: any) {
		throw new Error(`VariableNode#set() has no implementation.`);
	}
	get(stack: Stack) {
		this.declareVariable(stack, 'block');
	}
	declareVariable(stack: Stack, scopeType: ScopeType) {
		const value = this.init?.get(stack);
		if (value instanceof AwaitPromise) {
			value.node = this.id as AwaitPromiseInfoNode;
			value.declareVariable = true;
			value.scopeType = scopeType;
			value.node.declareVariable(stack, scopeType);
			stack.resolveAwait(value);
		} else {
			(this.id as (ExpressionNode & CanDeclareVariable)).declareVariable(stack, scopeType, value);
		}
	}
	entry(): string[] {
		return [];
	}
	event(parent?: string): string[] {
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
export class VariableDeclarationNode extends AbstractExpressionNode {
	static fromJSON(node: VariableDeclarationNode, deserializer: NodeDeserializer): VariableDeclarationNode {
		return new VariableDeclarationNode(
			node.declarations.map(deserializer),
			node.kind
		);
	}
	constructor(protected declarations: ExpressionNode[], protected kind: 'var' | 'let' | 'const') {
		super();
	}
	getDeclarations() {
		return this.declarations;
	}
	set(stack: Stack, value: any) {
		if (Array.isArray(value)) {
			throw new Error(`VariableDeclarationNode#set() has no implementation.`);
		}
		(this.declarations[0] as VariableNode).id.set(stack, value);
	}
	get(stack: Stack) {
		for (const item of this.declarations as (ExpressionNode & CanDeclareVariable)[]) {
			item.declareVariable(stack, this.kind === 'var' ? 'function' : 'block');
		}
	}
	entry(): string[] {
		return this.declarations.flatMap(v => v.entry());
	}
	event(parent?: string): string[] {
		return this.declarations.flatMap(v => v.event());
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
