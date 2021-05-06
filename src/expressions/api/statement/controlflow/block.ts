import type { NodeDeserializer, ExpressionNode } from '../../expression.js';
import { AbstractExpressionNode, ReturnValue } from '../../abstract.js';
import { Deserializer } from '../../deserialize/deserialize.js';
import { ScopedStack } from '../../scope.js';
import { TerminateNode } from './terminate.js';

/**
 * A block statement (or compound statement in other languages) is used to group zero or more statements.
 * The block is delimited by a pair of braces ("curly brackets") and may optionally be labelled:
 */
@Deserializer('block')
export class BlockNode extends AbstractExpressionNode {
	static fromJSON(node: BlockNode, deserializer: NodeDeserializer): BlockNode {
		return new BlockNode(node.statements.map(line => deserializer(line)), node.isStatement);
	}
	constructor(private statements: ExpressionNode[], public isStatement: boolean) {
		super();
	}
	getStatements() {
		return this.statements;
	}
	set(stack: ScopedStack, value: any) {
		throw new Error(`BlockNode#set() has no implementation.`);
	}
	get(stack: ScopedStack) {
		const stackForBlock = stack.newStack();
		for (const node of this.statements) {
			const value = node.get(stackForBlock);
			if (this.isStatement) {
				switch (true) {
					case TerminateNode.BreakSymbol === value:
					case TerminateNode.ContinueSymbol === value:
					case value instanceof ReturnValue:
						return value;
				}
			} else {
				if (value instanceof ReturnValue) {
					return value.value;
				}
			}
		}
	}
	entry(): string[] {
		return this.statements.flatMap(node => node.entry());
	}
	event(parent?: string): string[] {
		return this.statements.flatMap(node => node.event(parent));
	}
	toString(): string {
		return `{ ${this.statements.map(node => node.toString()).join('; ')}; }`;
	}
	toJson(): object {
		return { statements: this.statements.map(node => node.toJSON()), isStatement: this.isStatement };
	}
}
