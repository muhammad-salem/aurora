
import type { NodeDeserializer, ExpressionNode } from '../../expression.js';
import type { StackProvider } from '../../scope.js';
import type { ScopeProvider } from '../../context/provider.js';
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
	get(stack: ScopeProvider) {
		const value = this.init?.get(stack);
		if (value instanceof AwaitPromise) {
			value.node = this.id;
			stack.resolveAwait(value);
		} else {
			stack.stack[0].set(this.id.get(stack), value);
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
			throw new Error(`DeclarationsNode#set() has no implementation.`);
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

// @Deserializer('var')
// export class VarNode extends DeclarationsNode {
// 	static fromJSON(node: VarNode, deserializer: NodeDeserializer): VarNode {
// 		return new VarNode(
// 			node.declarations.map(deserializer),
// 			'var'
// 		);
// 	}
// }


// /**
//  * The let statement declares a block-scoped local variable,
//  * optionally initializing it to a value.
//  * 
//  */
// @Deserializer('let')
// export class LetNode extends DeclarationsNode {
// 	static fromJSON(node: LetNode, deserializer: NodeDeserializer): LetNode {
// 		return new LetNode(
// 			node.declarations.map(deserializer),
// 			'let'
// 		);
// 	}
// }

// /**
//  * Constants are block-scoped, much like variables declared using the let keyword.
//  * The value of a constant can't be changed through reassignment,
//  * and it can't be redeclare.
//  * 
//  * the impl set no constrain on the local variable
//  *
//  */
// @Deserializer('const')
// export class ConstNode extends DeclarationsNode {
// 	static fromJSON(node: ConstNode, deserializer: NodeDeserializer): ConstNode {
// 		return new ConstNode(
// 			node.declarations.map(deserializer),
// 			'const'
// 		);
// 	}
// }
