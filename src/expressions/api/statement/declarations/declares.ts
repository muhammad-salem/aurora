
import type { NodeDeserializer, ExpressionNode } from '../../expression.js';
import type { StackProvider } from '../../scope.js';
import { AbstractExpressionNode, AwaitPromise } from '../../abstract.js';
import { Deserializer } from '../../deserialize/deserialize.js';

@Deserializer('VariableDeclarator')
export class VariableNode extends AbstractExpressionNode {
	constructor(public id: ExpressionNode, public init?: ExpressionNode) {
		super();
	}
	getId() {
		return this.id;
	}
	getInit() {
		return this.init;
	}
	set(stack: StackProvider, value: any) {
		throw new Error(`VariableNode#set() has no implementation.`);
	}
	get(stack: StackProvider) {
		const value = this.init?.get(stack);
		if (value instanceof AwaitPromise) {
			value.node = this.id;
			stack.resolveAwait(value);
		} else {
			this.id.set(stack, value);
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
	set(stack: StackProvider, value: any) {
		if (Array.isArray(value)) {
			throw new Error(`VariableDeclarationNode#set() has no implementation.`);
		}
		(this.declarations[0] as VariableNode).id.set(stack, value);
	}
	get(stack: StackProvider) {
		stack.addEmptyProvider();
		for (const item of this.declarations) {
			item.get(stack);
		}
	}
	entry(): string[] {
		return [];
	}
	event(parent?: string): string[] {
		return [];
	}
	toString(): string {
		return `${this.kind} ${this.declarations.map(v => v.toString()).join(', ')}`;
	}
	toJson(): object {
		return {
			declarations: this.declarations.map(v => v.toJSON()),
			kind: this.kind
		};
	}
}
