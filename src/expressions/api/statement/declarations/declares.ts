
import type { NodeDeserializer, ExpressionNode } from '../../expression.js';
import type { ScopedStack } from '../../scope.js';
import { AbstractExpressionNode, AwaitPromise } from '../../abstract.js';
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
	toJSON() {
		return {
			variable: this.variable.toJSON(),
			value: this.value?.toJSON()
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
		for (const item of this.variables) {
			const value = item.value?.get(stack);
			if (value instanceof AwaitPromise) {
				value.node = item.variable;
				stack.resolveAwait(value);
			} else {
				item.variable.set(stack, value);
			}
		}
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
			variables: this.variables.map(v => v.toJSON())
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
 * and it can't be redeclare.
 * 
 * the impl set no constrain on the local variable
 *
 */
@Deserializer('const')
export class ConstNode extends DeclarationsNode {
	static fromJSON(node: ConstNode, deserializer: NodeDeserializer): ConstNode {
		return new ConstNode(
			node.variables.map(item => { return new Variable(deserializer(item.variable), item.value && deserializer(item.value)) })
		);
	}
	toString(): string {
		return `const ${this.variables.map(v => v.toString()).join(', ')}`;
	}
}
