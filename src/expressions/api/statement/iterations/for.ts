import type { NodeDeserializer, ExpressionNode } from '../../expression.js';
import type { Stack } from '../../../scope/stack.js';
import { AbstractExpressionNode, ReturnValue } from '../../abstract.js';
import { Deserializer } from '../../deserialize/deserialize.js';
import { BreakStatement, ContinueStatement } from '../controlflow/terminate.js';


/**
 * The if statement executes a statement if a specified condition is truthy.
 * If the condition is falsy, another statement can be executed.
 * 
 */
@Deserializer('ForStatement')
export class ForNode extends AbstractExpressionNode {
	static fromJSON(node: ForNode, deserializer: NodeDeserializer): ForNode {
		return new ForNode(
			deserializer(node.body),
			node.init && deserializer(node.init),
			node.test && deserializer(node.test),
			node.update && deserializer(node.update)
		);
	}
	constructor(
		private body: ExpressionNode,
		private init?: ExpressionNode,
		private test?: ExpressionNode,
		private update?: ExpressionNode) {
		super();
	}
	getBody() {
		return this.body;
	}
	getInit() {
		return this.init;
	}
	getTest() {
		return this.test;
	}
	getUpdate() {
		return this.update;
	}
	set(stack: Stack, value: any) {
		throw new Error(`ForNode#set() has no implementation.`);
	}
	get(stack: Stack) {
		const forBlock = stack.pushBlockScope();
		for (this.init?.get(stack); this.test?.get(stack) ?? true; this.update?.get(stack)) {
			const result = this.body.get(stack);
			// useless case, as it at the end of for statement
			// an array/block statement, should return last signal
			if (ContinueStatement.ContinueSymbol === result) {
				continue;
			}
			if (BreakStatement.BreakSymbol === result) {
				break;
			}
			if (result instanceof ReturnValue) {
				stack.clearTo(forBlock);
				return result;
			}
		}
		stack.clearTo(forBlock);
		return void 0;
	}
	events(parent?: string): string[] {
		return [...this.init?.events() || [], ...this.test?.events() || []];
	}
	toString(): string {
		return `for (${this.init?.toString()};${this.test?.toString()};${this.init?.toString()}) ${this.body.toString()}`;
	}
	toJson(): object {
		return {
			body: this.body.toJSON(),
			init: this.init?.toJSON(),
			test: this.test?.toJSON(),
			update: this.update?.toJSON(),
		};
	}
}

@Deserializer('ForOfStatement')
export class ForOfNode extends AbstractExpressionNode {
	static fromJSON(node: ForOfNode, deserializer: NodeDeserializer): ForOfNode {
		return new ForOfNode(
			deserializer(node.left),
			deserializer(node.right),
			deserializer(node.body)
		);
	}
	constructor(
		private left: ExpressionNode,
		private right: ExpressionNode,
		private body: ExpressionNode) {
		super();
	}
	getLeft() {
		return this.left;
	}
	getRight() {
		return this.right;
	}
	getBody() {
		return this.body;
	}
	set(stack: Stack, value: any) {
		throw new Error(`ForOfNode#set() has no implementation.`);
	}
	get(stack: Stack) {
		const iterable = <any[]>this.right.get(stack);
		for (const iterator of iterable) {
			const forBlock = stack.pushBlockScope();
			this.left.set(stack, iterator);
			const result = this.body.get(stack);
			// useless case, as it at the end of for statement
			// an array/block statement, should return last signal
			if (ContinueStatement.ContinueSymbol === result) {
				continue;
			}
			else if (BreakStatement.BreakSymbol === result) {
				break;
			}
			else if (result instanceof ReturnValue) {
				stack.clearTo(forBlock);
				return result;
			}
			stack.clearTo(forBlock);
		}
		return void 0;
	}
	events(parent?: string): string[] {
		return this.right.events();
	}
	toString(): string {
		return `for (${this.left?.toString()} of ${this.right.toString()}) ${this.body.toString()}`;
	}
	toJson(): object {
		return {
			left: this.left.toJSON(),
			right: this.right.toJSON(),
			body: this.body.toJSON(),
		};
	}
}

@Deserializer('ForInStatement')
export class ForInNode extends AbstractExpressionNode {
	static fromJSON(node: ForInNode, deserializer: NodeDeserializer): ForInNode {
		return new ForInNode(
			deserializer(node.left),
			deserializer(node.right),
			deserializer(node.body)
		);
	}
	// variable of iterable
	constructor(
		private left: ExpressionNode,
		private right: ExpressionNode,
		private body: ExpressionNode) {
		super();
	}
	getLeft() {
		return this.left;
	}
	getRight() {
		return this.right;
	}
	getBody() {
		return this.body;
	}
	set(stack: Stack, value: any) {
		throw new Error(`ForOfNode#set() has no implementation.`);
	}
	get(stack: Stack) {
		const iterable = <object>this.right.get(stack);
		for (const iterator in iterable) {
			const forBlock = stack.pushBlockScope();
			this.left.set(stack, iterator);
			const result = this.body.get(stack);
			// useless case, as it at the end of for statement
			// an array/block statement, should return last signal
			if (ContinueStatement.ContinueSymbol === result) {
				continue;
			}
			else if (BreakStatement.BreakSymbol === result) {
				break;
			}
			else if (result instanceof ReturnValue) {
				stack.clearTo(forBlock);
				return result;
			}
			stack.clearTo(forBlock);
		}
		return void 0;
	}
	events(parent?: string): string[] {
		return this.right.events();
	}
	toString(): string {
		return `for (${this.left.toString()} in ${this.right.toString()}) ${this.body.toString()}`;
	}
	toJson(): object {
		return {
			left: this.left.toJSON(),
			right: this.right.toJSON(),
			body: this.body.toJSON(),
		};
	}
}

@Deserializer('ForAwaitOfStatement')
export class ForAwaitOfNode extends AbstractExpressionNode {
	static fromJSON(node: ForAwaitOfNode, deserializer: NodeDeserializer): ForAwaitOfNode {
		return new ForAwaitOfNode(
			deserializer(node.left),
			deserializer(node.right),
			deserializer(node.body)
		);
	}
	// variable of iterable
	constructor(
		private left: ExpressionNode,
		private right: ExpressionNode,
		private body: ExpressionNode) {
		super();
	}
	getLeft() {
		return this.left;
	}
	getRight() {
		return this.right;
	}
	getBody() {
		return this.body;
	}
	set(stack: Stack, value: any) {
		throw new Error(`ForAwaitOfNode#set() has no implementation.`);
	}
	get(stack: Stack) {
		const iterable: AsyncIterable<any> = this.right.get(stack);
		const forAwaitBody = (iterator: any): any => {
			const forBlock = stack.pushBlockScope();
			// const forOfStack = stack.newStack();
			this.left.set(stack, iterator);
			const result = this.body.get(stack);
			stack.clearTo(forBlock);
			return result;
		};
		stack.forAwaitAsyncIterable = { iterable, forAwaitBody };
	}
	events(parent?: string): string[] {
		return this.right.events();
	}
	toString(): string {
		return `for (${this.left?.toString()} of ${this.right.toString()}) ${this.body.toString()}`;
	}
	toJson(): object {
		return {
			left: this.left.toJSON(),
			right: this.right.toJSON(),
			body: this.body.toJSON(),
		};
	}
}
