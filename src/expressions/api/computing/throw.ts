import type { NodeDeserializer, ExpressionNode } from '../expression.js';
import type { StackProvider } from '../scope.js';
import { AbstractExpressionNode } from '../abstract.js';
import { Deserializer } from '../deserialize/deserialize.js';

/**
 * The expression whose value is to be returned. 
 * If omitted, undefined is returned instead.
 */
@Deserializer('throw')
export class ThrowNode extends AbstractExpressionNode {
	static fromJSON(node: ThrowNode, deserializer: NodeDeserializer): ThrowNode {
		return new ThrowNode(deserializer(node.exception));
	}
	constructor(private exception: ExpressionNode) {
		super();
	}
	getException() {
		return this.exception;
	}
	set(stack: StackProvider, value: any) {
		throw new Error(`ReturnNode#set() has no implementation.`);
	}
	get(stack: StackProvider) {
		throw this.exception.get(stack);
	}
	entry(): string[] {
		return this.exception.entry();
	}
	event(parent?: string): string[] {
		return this.exception.event();
	}
	toString(): string {
		return `throw ${this.exception.toString()}`;
	}
	toJson(): object {
		return { exception: this.exception?.toJSON() };
	}
}

@Deserializer('try')
export class TryCatchNode extends AbstractExpressionNode {
	static fromJSON(node: TryCatchNode, deserializer: NodeDeserializer): TryCatchNode {
		return new TryCatchNode(
			deserializer(node.tryBlock),
			node.catchVar ? deserializer(node.catchVar) : void 0,
			node.catchBlock ? deserializer(node.catchBlock) : void 0,
			node.finallyBlock ? deserializer(node.finallyBlock) : void 0
		);
	}
	constructor(private tryBlock: ExpressionNode, private catchVar?: ExpressionNode, private catchBlock?: ExpressionNode, private finallyBlock?: ExpressionNode) {
		super();
	}
	getCondition() {
		return this.tryBlock;
	}
	getTHenStatement() {
		return this.catchBlock;
	}
	getElseStatement() {
		return this.finallyBlock;
	}
	set(stack: StackProvider, value: any) {
		throw new Error(`TryCatchNode#set() has no implementation.`);
	}
	get(stack: StackProvider) {
		if (this.tryBlock && this.catchBlock && this.finallyBlock) {
			try {
				this.tryBlock.get(stack.newStack());
			} catch (error) {
				const catchScope = stack.newStack();
				this.catchVar?.set(catchScope, error);
				this.catchBlock.get(catchScope);
			} finally {
				this.finallyBlock.get(stack.newStack());
			}
		} else if (this.tryBlock && this.catchBlock) {
			try {
				this.tryBlock.get(stack.newStack());
			} catch (error) {
				const catchScope = stack.newStack();
				this.catchVar?.set(catchScope, error);
				this.catchBlock.get(catchScope);
			}
		} else if (this.tryBlock && this.finallyBlock) {
			try {
				this.tryBlock.get(stack.newStack());
			} finally {
				this.finallyBlock.get(stack.newStack());
			}
		} else {
			throw new Error(`Uncaught SyntaxError: Missing catch or finally after try`);
		}
	}
	entry(): string[] {
		return this.tryBlock.entry().concat(this.catchBlock?.entry() || []).concat(this.finallyBlock?.entry() || []);
	}
	event(parent?: string): string[] {
		return this.tryBlock.event().concat(this.catchBlock?.event() || []).concat(this.finallyBlock?.event() || []);
	}
	toString(): string {
		return `try ${this.tryBlock.toString()} ${this.catchBlock ? `catch ${this.catchVar ? `(${this.catchVar.toString()})` : ''}${this.catchBlock.toString()}` : ''} ${this.finallyBlock ? `finally ${this.finallyBlock.toString()}` : ''}`;
	}
	toJson(): object {
		return {
			tryBlock: this.tryBlock.toJSON(),
			catchVar: this.catchVar?.toJSON(),
			catchBlock: this.catchBlock?.toJSON(),
			finallyBlock: this.finallyBlock?.toJSON(),
		};
	}
}
