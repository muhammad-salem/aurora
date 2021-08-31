import type { NodeDeserializer, ExpressionNode } from '../../expression.js';
import type { Stack } from '../../../scope/stack.js';
import { AbstractExpressionNode, ReturnValue } from '../../abstract.js';
import { Deserializer } from '../../deserialize/deserialize.js';
import { BreakStatement, ContinueStatement } from './terminate.js';

/**
 * A block statement (or compound statement in other languages) is used to group zero or more statements.
 * The block is delimited by a pair of braces ("curly brackets") and may optionally be labelled:
 */
@Deserializer('BlockStatement')
export class BlockStatement extends AbstractExpressionNode {
	static fromJSON(node: BlockStatement, deserializer: NodeDeserializer): BlockStatement {
		return new BlockStatement(node.body.map(line => deserializer(line)), node.isStatement);
	}
	constructor(private body: ExpressionNode[], public isStatement: boolean) {
		super();
	}
	getBody() {
		return this.body;
	}
	set(stack: Stack, value: any) {
		throw new Error(`BlockStatement#set() has no implementation.`);
	}
	get(stack: Stack) {
		const blockScope = stack.pushBlockScope();
		for (const node of this.body) {
			const value = node.get(stack);
			if (this.isStatement) {
				switch (true) {
					case BreakStatement.BreakSymbol === value:
					case ContinueStatement.ContinueSymbol === value:
					case value instanceof ReturnValue:
						stack.clearTo(blockScope);
						return value;
				}
			} else {
				if (value instanceof ReturnValue) {
					stack.clearTo(blockScope);
					return value.value;
				}
			}
		}
		stack.clearTo(blockScope);
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
