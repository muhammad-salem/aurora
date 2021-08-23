import type { NodeDeserializer, ExpressionNode } from '../../expression.js';
import { AbstractExpressionNode, ReturnValue } from '../../abstract.js';
import { Deserializer } from '../../deserialize/deserialize.js';
import { StackProvider } from '../../scope.js';
import { TerminateNode } from './terminate.js';

/**
 * A block statement (or compound statement in other languages) is used to group zero or more statements.
 * The block is delimited by a pair of braces ("curly brackets") and may optionally be labelled:
 */
@Deserializer('BlockStatement')
export class BlockNode extends AbstractExpressionNode {
	static fromJSON(node: BlockNode, deserializer: NodeDeserializer): BlockNode {
		return new BlockNode(node.body.map(line => deserializer(line)), node.isStatement);
	}
	constructor(private body: ExpressionNode[], public isStatement: boolean) {
		super();
	}
	getBody() {
		return this.body;
	}
	set(stack: StackProvider, value: any) {
		throw new Error(`BlockNode#set() has no implementation.`);
	}
	get(stack: StackProvider) {
		const stackForBlock = stack.newStack();
		for (const node of this.body) {
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
		return this.body.flatMap(node => node.entry());
	}
	event(parent?: string): string[] {
		return this.body.flatMap(node => node.event(parent));
	}
	toString(): string {
		return `{ ${this.body.map(node => node.toString()).join('; ')}; }`;
	}
	toJson(): object {
		return { body: this.body.map(node => node.toJSON()), isStatement: this.isStatement };
	}
}
