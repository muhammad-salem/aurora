import type { NodeDeserializer, ExpressionNode } from '../../expression.js';
import { AbstractExpressionNode } from '../../abstract.js';
import { Deserializer } from '../../deserialize/deserialize.js';
import { ScopedStack } from '../../scope.js';
import { TerminateNode } from './terminate.js';
import { ReturnValue } from '../../computing/return.js';

/**
 * A block statement (or compound statement in other languages) is used to group zero or more statements.
 * The block is delimited by a pair of braces ("curly brackets") and may optionally be labelled:
 */
@Deserializer('block')
export class BlockNode extends AbstractExpressionNode {
	static fromJSON(node: BlockNode, deserializer: NodeDeserializer): BlockNode {
		const nodes = node.statements.map(line => deserializer(line));
		return new BlockNode(node.statements);
	}
	constructor(private statements: ExpressionNode[]) {
		super();
	}
	getStatements() {
		return this.statements;
	}
	set(stack: ScopedStack, value: any) {
		throw new Error(`BlockNode#set() has no implementation.`);
	}
	get(stack: ScopedStack) {
		let value;
		const stackForBlock = stack.newStack();
		for (const node of this.statements) {
			value = node.get(stackForBlock);
			if (TerminateNode.BreakSymbol === value) {
				break;
			}
			if (TerminateNode.ContinueSymbol === value) {
				continue;
			}
			if (value instanceof ReturnValue) {
				return value.value;
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
		return { statements: this.statements.map(node => node.toJSON()) };
	}
}
