import type { NodeDeserializer, ExpressionNode } from '../../expression.js';
import type { ScopedStack } from '../../scope.js';
import { AbstractExpressionNode } from '../../abstract.js';
import { Deserializer } from '../../deserialize/deserialize.js';
import { TerminateNode } from '../controlflow/terminate.js';
import { ReturnValue } from '../../computing/return.js';

/**
 * The if statement executes a statement if a specified condition is truthy.
 * If the condition is falsy, another statement can be executed.
 * 
 */
@Deserializer('for')
export class ForNode extends AbstractExpressionNode {
	static KEYWORDS = ['for'];
	static fromJSON(node: ForNode, deserializer: NodeDeserializer): ForNode {
		return new ForNode(
			deserializer(node.statement),
			node.initialization && deserializer(node.initialization),
			node.condition && deserializer(node.condition),
			node.finalExpression && deserializer(node.finalExpression)
		);
	}
	constructor(private statement: ExpressionNode,
		private initialization?: ExpressionNode,
		private condition?: ExpressionNode,
		private finalExpression?: ExpressionNode) {
		super();
	}
	getStatement() {
		return this.statement;
	}
	getInitialization() {
		return this.initialization;
	}
	getCondition() {
		return this.condition;
	}
	getFinalExpression() {
		return this.finalExpression;
	}
	set(stack: ScopedStack, value: any) {
		throw new Error(`ForNode#set() has no implementation.`);
	}
	get(stack: ScopedStack) {
		stack = stack.newStack();
		for (this.initialization?.get(stack); this.condition?.get(stack) ?? true; this.finalExpression?.get(stack)) {
			const result = this.statement.get(stack);
			// useless case, as it at the end of for statement
			// an array/block statement, should return last signal
			if (TerminateNode.ContinueSymbol === result) {
				continue;
			}
			if (TerminateNode.BreakSymbol === result) {
				break;
			}
			if (result instanceof ReturnValue) {
				return result;
			}
		}
		return void 0;
	}
	entry(): string[] {
		return [];
	}
	event(parent?: string): string[] {
		return [];
	}
	toString(): string {
		return `for (${this.initialization?.toString()};${this.condition?.toString()};${this.initialization?.toString()}) ${this.statement.toString()}`;
	}
	toJson(): object {
		return {
			statement: this.statement.toJSON(),
			initialization: this.initialization?.toJSON(),
			condition: this.condition?.toJSON(),
			finalExpression: this.finalExpression?.toJSON(),
		};
	}
}

@Deserializer('for-of')
export class ForOfNode extends AbstractExpressionNode {
	static KEYWORDS = ['for', 'of'];
	static fromJSON(node: ForOfNode, deserializer: NodeDeserializer): ForOfNode {
		return new ForOfNode(
			deserializer(node.variable),
			deserializer(node.iterable),
			deserializer(node.statement)
		);
	}
	// variable of iterable
	constructor(private variable: ExpressionNode,
		private iterable: ExpressionNode,
		private statement: ExpressionNode) {
		super();
	}
	getIterable() {
		return this.iterable;
	}
	getStatement() {
		return this.statement;
	}
	set(stack: ScopedStack, value: any) {
		throw new Error(`ForOfNode#set() has no implementation.`);
	}
	get(stack: ScopedStack) {
		const iterable = <any[]>this.iterable.get(stack);
		for (const iterator of iterable) {
			const forOfStack = stack.newStack();
			this.variable.set(forOfStack, iterator);
			const result = this.statement.get(forOfStack);
			// useless case, as it at the end of for statement
			// an array/block statement, should return last signal
			if (TerminateNode.ContinueSymbol === result) {
				continue;
			}
			else if (TerminateNode.BreakSymbol === result) {
				break;
			}
			else if (result instanceof ReturnValue) {
				return result;
			}
		}
		return void 0;
	}
	entry(): string[] {
		return [];
	}
	event(parent?: string): string[] {
		return [];
	}
	toString(): string {
		return `for (${this.variable?.toString()} of ${this.iterable.toString()}) ${this.statement.toString()}`;
	}
	toJson(): object {
		return {
			variable: this.variable.toJSON(),
			iterable: this.iterable.toJSON(),
			statement: this.statement.toJSON(),
		};
	}
}

@Deserializer('for-in')
export class ForInNode extends AbstractExpressionNode {
	static KEYWORDS = ['for', 'in'];
	static fromJSON(node: ForInNode, deserializer: NodeDeserializer): ForInNode {
		return new ForInNode(
			deserializer(node.variable),
			deserializer(node.object),
			deserializer(node.statement)
		);
	}
	// variable of iterable
	constructor(private variable: ExpressionNode,
		private object: ExpressionNode,
		private statement: ExpressionNode) {
		super();
	}
	getObject() {
		return this.object;
	}
	getStatement() {
		return this.statement;
	}
	set(stack: ScopedStack, value: any) {
		throw new Error(`ForOfNode#set() has no implementation.`);
	}
	get(stack: ScopedStack) {
		const iterable = <object>this.object.get(stack);
		for (const iterator in iterable) {
			const forOfStack = stack.newStack();
			this.variable.set(forOfStack, iterator);
			const result = this.statement.get(forOfStack);
			// useless case, as it at the end of for statement
			// an array/block statement, should return last signal
			if (TerminateNode.ContinueSymbol === result) {
				continue;
			}
			else if (TerminateNode.BreakSymbol === result) {
				break;
			}
			else if (result instanceof ReturnValue) {
				return result;
			}
		}
		return void 0;
	}
	entry(): string[] {
		return [];
	}
	event(parent?: string): string[] {
		return [];
	}
	toString(): string {
		return `for (${this.variable.toString()} in ${this.object.toString()}) ${this.statement.toString()}`;
	}
	toJson(): object {
		return {
			variable: this.variable.toJSON(),
			object: this.object.toJSON(),
			statement: this.statement.toJSON(),
		};
	}
}

@Deserializer('for-await-of')
export class ForAwaitOfNode extends AbstractExpressionNode {
	static KEYWORDS = ['for', 'await', 'of'];
	static fromJSON(node: ForAwaitOfNode, deserializer: NodeDeserializer): ForAwaitOfNode {
		return new ForAwaitOfNode(
			deserializer(node.variable),
			deserializer(node.iterable),
			deserializer(node.statement)
		);
	}
	// variable of iterable
	constructor(private variable: ExpressionNode,
		private iterable: ExpressionNode,
		private statement: ExpressionNode) {
		super();
	}
	getIterable() {
		return this.iterable;
	}
	getStatement() {
		return this.statement;
	}
	set(stack: ScopedStack, value: any) {
		throw new Error(`ForAwaitOfNode#set() has no implementation.`);
	}
	get(stack: ScopedStack) {
		const iterable: { [Symbol.asyncIterator](): AsyncIterator<any> } = this.iterable.get(stack);
		(async () => {
			for await (const iterator of iterable) {
				const forOfStack = stack.newStack();
				this.variable.set(forOfStack, iterator);
				const result = this.statement.get(forOfStack);
				// useless case, as it at the end of for statement
				// an array/block statement, should return last signal
				if (TerminateNode.ContinueSymbol === result) {
					continue;
				}
				else if (TerminateNode.BreakSymbol === result) {
					break;
				}
				else if (result instanceof ReturnValue) {
					return result;
				}
			}
		})();
		return void 0;
	}
	entry(): string[] {
		return [];
	}
	event(parent?: string): string[] {
		return [];
	}
	toString(): string {
		return `for (${this.variable?.toString()} of ${this.iterable.toString()}) ${this.statement.toString()}`;
	}
	toJson(): object {
		return {
			variable: this.variable.toJSON(),
			iterable: this.iterable.toJSON(),
			statement: this.statement.toJSON(),
		};
	}
}
