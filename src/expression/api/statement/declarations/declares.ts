
import type { NodeDeserializer, ExpressionNode } from '../../expression.js';
import type { ScopedStack } from '../../scope.js';
import { AbstractExpressionNode } from '../../abstract.js';
import { Deserializer } from '../../deserialize/deserialize.js';

export class Variable {
	constructor(public variable: ExpressionNode, public value?: ExpressionNode) { }
	getVariable() {
		return this.variable;
	}
	getValue() {
		return this.value;
	}
	toString() {
		return `${this.variable.toString()}${this.value ? ` = ${this.value.toString()}` : ''}`;
	}
	toJson() {
		return {
			variable: this.variable.toString(),
			value: this.value?.toString()
		};
	}
}

export abstract class DeclarationsNode extends AbstractExpressionNode {
	constructor(protected variables: Variable[]) {
		super();
	}
	getVariables() {
		return this.variables;
	}
	set(stack: ScopedStack, value: any) {
		throw new Error(`LetNode#set() has no implementation.`);
	}
	get(stack: ScopedStack) {
		this.variables.forEach(item => {
			stack.localScop.set(item.variable.get(stack), item.value?.get(stack));
		});
	}
	entry(): string[] {
		return [];
	}
	event(parent?: string): string[] {
		return [];
	}
	abstract toString(): string;
	toJson(): object {
		return {
			variables: this.variables.map(v => v.toJson())
		};
	}
}

/**
 * The let statement declares a block-scoped local variable,
 * optionally initializing it to a value.
 * 
 */
@Deserializer('let')
export class LetNode extends DeclarationsNode {
	static KEYWORDS = ['let'];
	static fromJSON(node: LetNode, deserializer: NodeDeserializer): LetNode {
		return new LetNode(
			node.variables.map(item => { return new Variable(deserializer(item.variable), item.value && deserializer(item.value)) })
		);
	}
	toString(): string {
		return `let ${this.variables.map(v => v.toString()).join(', ')}`;
	}
}

/**
 * Constants are block-scoped, much like variables declared using the let keyword.
 * The value of a constant can't be changed through reassignment,
 * and it can't be redeclared.
 * 
 * the impl set no constrain on the local variable
 *
 */
@Deserializer('const')
export class ConstNode extends DeclarationsNode {
	static KEYWORDS = ['const'];
	static fromJSON(node: ConstNode, deserializer: NodeDeserializer): ConstNode {
		return new ConstNode(
			node.variables.map(item => { return new Variable(deserializer(item.variable), item.value && deserializer(item.value)) })
		);
	}
	toString(): string {
		return `const ${this.variables.map(v => v.toString()).join(', ')}`;
	}
}
