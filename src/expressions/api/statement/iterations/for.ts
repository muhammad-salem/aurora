import type { NodeDeserializer, ExpressionNode } from '../../expression.js';
import type { StackProvider } from '../../scope.js';
import { AbstractExpressionNode, ReturnValue } from '../../abstract.js';
import { Deserializer } from '../../deserialize/deserialize.js';
import { TerminateNode } from '../controlflow/terminate.js';


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
	set(stack: StackProvider, value: any) {
		throw new Error(`ForNode#set() has no implementation.`);
	}
	get(stack: StackProvider) {
		stack = stack.newStack();
		for (this.init?.get(stack); this.test?.get(stack) ?? true; this.update?.get(stack)) {
			const result = this.body.get(stack);
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
		return [...this.init?.event() || [], ...this.test?.event() || []];
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
	set(stack: StackProvider, value: any) {
		throw new Error(`ForOfNode#set() has no implementation.`);
	}
	get(stack: StackProvider) {
		const iterable = <any[]>this.right.get(stack);
		for (const iterator of iterable) {
			const forOfStack = stack.newStack();
			this.left.set(forOfStack, iterator);
			const result = this.body.get(forOfStack);
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
		return this.right.event();
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
	set(stack: StackProvider, value: any) {
		throw new Error(`ForOfNode#set() has no implementation.`);
	}
	get(stack: StackProvider) {
		const iterable = <object>this.right.get(stack);
		for (const iterator in iterable) {
			const forInStack = stack.newStack();
			this.left.set(forInStack, iterator);
			const result = this.body.get(forInStack);
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
		return this.right.event();
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
	set(stack: StackProvider, value: any) {
		throw new Error(`ForAwaitOfNode#set() has no implementation.`);
	}
	get(stack: StackProvider) {
		const iterable: AsyncIterable<any> = this.right.get(stack);
		const forAwaitBody = (iterator: any): any => {
			const forOfStack = stack.newStack();
			this.left.set(forOfStack, iterator);
			const result = this.body.get(forOfStack);
			return result;
		};
		stack.forAwaitAsyncIterable = { iterable, forAwaitBody };
	}
	entry(): string[] {
		return [];
	}
	event(parent?: string): string[] {
		return this.right.event();
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
