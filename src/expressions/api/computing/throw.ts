import type {
	NodeDeserializer, ExpressionNode, ExpressionEventPath,
	VisitNodeType, SourceLocation
} from '../expression.js';
import type { Stack } from '../../scope/stack.js';
import { AbstractExpressionNode } from '../abstract.js';
import { Deserializer } from '../deserialize/deserialize.js';

/**
 * The expression whose value is to be returned. 
 * If omitted, undefined is returned instead.
 */
@Deserializer('ThrowStatement')
export class ThrowStatement extends AbstractExpressionNode {
	static fromJSON(node: ThrowStatement, deserializer: NodeDeserializer): ThrowStatement {
		return new ThrowStatement(deserializer(node.argument), node.loc);
	}
	static visit(node: ThrowStatement, visitNode: VisitNodeType): void {
		visitNode(node.argument);
	}
	constructor(private argument: ExpressionNode, loc?: SourceLocation) {
		super(loc);
	}
	getArgument() {
		return this.argument;
	}
	set(stack: Stack, value: any) {
		throw new Error(`ThrowStatement#set() has no implementation.`);
	}
	get(stack: Stack) {
		throw this.argument.get(stack);
	}
	dependency(computed?: true): ExpressionNode[] {
		return this.argument.dependency(computed);
	}
	dependencyPath(computed?: true): ExpressionEventPath[] {
		return this.argument.dependencyPath(computed);
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
			node.loc
		);
	}
	constructor(private body: ExpressionNode, private param?: ExpressionNode, loc?: SourceLocation) {
		super(loc);
	}
	getParam() {
		return this.param;
	}
	getBody() {
		return this.body;
	}
	set(stack: Stack, error: any) {
		this.param?.set(stack, error);
	}
	get(stack: Stack, thisContext?: any) {
		return this.body.get(stack);
	}
	dependency(computed?: true): ExpressionNode[] {
		return this.body.dependency();
	}
	dependencyPath(computed?: true): ExpressionEventPath[] {
		return this.body.dependencyPath(computed);
	}
	toString(): string {
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
			node.finalizer ? deserializer(node.finalizer) : void 0,
			node.loc
		);
	}
	constructor(private block: ExpressionNode,
		private handler?: ExpressionNode,
		private finalizer?: ExpressionNode,
		loc?: SourceLocation) {
		super(loc);
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
	set(stack: Stack, value: any) {
		throw new Error(`TryCatchNode#set() has no implementation.`);
	}
	get(stack: Stack) {
		const scope = stack.lastScope();
		if (this.block && this.handler && this.finalizer) {
			try {
				const blockScope = stack.pushBlockScope();
				this.block.get(stack);
				stack.clearTo(blockScope);
			} catch (error) {
				stack.clearTill(scope);
				const blockScope = stack.pushBlockScope();
				this.handler.set(stack, error);
				this.handler.get(stack);
				stack.clearTo(blockScope);
			} finally {
				stack.clearTill(scope);
				const blockScope = stack.pushBlockScope();
				this.finalizer.get(stack);
				stack.clearTo(blockScope);
			}
		} else if (this.block && this.handler) {
			try {
				const blockScope = stack.pushBlockScope();
				this.block.get(stack);
				stack.clearTo(blockScope);
			} catch (error) {
				stack.clearTill(scope);
				const blockScope = stack.pushBlockScope();
				stack.clearTo(blockScope);
				this.handler.set(stack, error);
				this.handler.get(stack);
				stack.clearTo(blockScope);
			}
		} else if (this.block && this.finalizer) {
			try {
				const blockScope = stack.pushBlockScope();
				this.block.get(stack);
				stack.clearTo(blockScope);
			} finally {
				stack.clearTill(scope);
				const blockScope = stack.pushBlockScope();
				this.finalizer.get(stack);
				stack.clearTo(blockScope);
			}
		} else {
			throw new Error(`Uncaught SyntaxError: Missing catch or finally after try`);
		}
		stack.clearTill(scope);
	}
	dependency(computed?: true): ExpressionNode[] {
		return this.block.dependency()
			.concat(this.handler?.dependency() || [])
			.concat(this.finalizer?.dependency() || []);
	}
	dependencyPath(computed?: true): ExpressionEventPath[] {
		return this.block.dependencyPath(computed)
			.concat(
				this.handler?.dependencyPath(computed) || [],
				this.finalizer?.dependencyPath(computed) || []
			);
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
