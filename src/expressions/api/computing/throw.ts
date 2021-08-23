import type { NodeDeserializer, ExpressionNode } from '../expression.js';
import type { StackProvider } from '../scope.js';
import { AbstractExpressionNode } from '../abstract.js';
import { Deserializer } from '../deserialize/deserialize.js';

/**
 * The expression whose value is to be returned. 
 * If omitted, undefined is returned instead.
 */
@Deserializer('ThrowStatement')
export class ThrowNode extends AbstractExpressionNode {
	static fromJSON(node: ThrowNode, deserializer: NodeDeserializer): ThrowNode {
		return new ThrowNode(deserializer(node.argument));
	}
	constructor(private argument: ExpressionNode) {
		super();
	}
	getArgument() {
		return this.argument;
	}
	set(stack: StackProvider, value: any) {
		throw new Error(`ThrowNode#set() has no implementation.`);
	}
	get(stack: StackProvider) {
		throw this.argument.get(stack);
	}
	entry(): string[] {
		return this.argument.entry();
	}
	event(parent?: string): string[] {
		return this.argument.event();
	}
	toString(): string {
		return `throw ${this.argument.toString()}`;
	}
	toJson(): object {
		return { argument: this.argument?.toJSON() };
	}
}


@Deserializer('CatchClause')
export class CatchClauseNode extends AbstractExpressionNode {
	static fromJSON(node: CatchClauseNode, deserializer: NodeDeserializer): CatchClauseNode {
		return new CatchClauseNode(
			deserializer(node.body),
			node.param ? deserializer(node.param) : void 0,
		);
	}
	constructor(private body: ExpressionNode, private param?: ExpressionNode,) {
		super();
	}
	getParam() {
		return this.param;
	}
	getBody() {
		return this.body;
	}
	set(stack: StackProvider, error: any) {
		this.param?.set(stack, error);
	}
	get(stack: StackProvider, thisContext?: any) {
		return this.body.get(stack);
	}
	entry(): string[] {
		return [];
	}
	event(parent?: string): string[] {
		return [];
	}
	toString(): string {
		// return `catch ${this.catchVar ? `(${this.catchVar.toString()})`;
		return `catch (${this.param?.toString() || ''}) ${this.body.toString()}`;
	}
	toJson(key?: string): { [key: string]: any; } {
		return {
			param: this.param?.toJSON(),
			body: this.body.toJSON()
		};
	}

}

@Deserializer('TryStatement')
export class TryCatchNode extends AbstractExpressionNode {
	static fromJSON(node: TryCatchNode, deserializer: NodeDeserializer): TryCatchNode {
		return new TryCatchNode(
			deserializer(node.block),
			node.handler ? deserializer(node.handler) : void 0,
			node.finalizer ? deserializer(node.finalizer) : void 0
		);
	}
	constructor(private block: ExpressionNode, private handler?: ExpressionNode, private finalizer?: ExpressionNode) {
		super();
	}
	getBlock() {
		return this.block;
	}
	getHandler() {
		return this.handler;
	}
	getFinalizer() {
		return this.finalizer;
	}
	set(stack: StackProvider, value: any) {
		throw new Error(`TryCatchNode#set() has no implementation.`);
	}
	get(stack: StackProvider) {
		if (this.block && this.handler && this.finalizer) {
			try {
				this.block.get(stack.newStack());
			} catch (error) {
				const catchScope = stack.newStack();
				this.handler.set(catchScope, error);
				this.handler.get(catchScope);
			} finally {
				this.finalizer.get(stack.newStack());
			}
		} else if (this.block && this.handler) {
			try {
				this.block.get(stack.newStack());
			} catch (error) {
				const catchScope = stack.newStack();
				this.handler.set(catchScope, error);
				this.handler.get(catchScope);
			}
		} else if (this.block && this.finalizer) {
			try {
				this.block.get(stack.newStack());
			} finally {
				this.finalizer.get(stack.newStack());
			}
		} else {
			throw new Error(`Uncaught SyntaxError: Missing catch or finally after try`);
		}
	}
	entry(): string[] {
		return this.block.entry().concat(this.handler?.entry() || []).concat(this.finalizer?.entry() || []);
	}
	event(parent?: string): string[] {
		return this.block.event().concat(this.handler?.event() || []).concat(this.finalizer?.event() || []);
	}
	toString(): string {
		return `try ${this.block.toString()} ${this.handler?.toString() || ''} ${this.finalizer ? `finally ${this.finalizer.toString()}` : ''}`;
	}
	toJson(): object {
		return {
			block: this.block.toJSON(),
			handler: this.handler?.toJSON(),
			finalizer: this.finalizer?.toJSON(),
		};
	}
}
