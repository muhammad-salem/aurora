import type {
	NodeDeserializer, ExpressionNode,
	ExpressionEventPath, VisitNodeType
} from '../../expression.js';
import type { Scope } from '../../../scope/scope.js';
import type { Stack } from '../../../scope/stack.js';
import { AbstractExpressionNode, ReturnValue } from '../../abstract.js';
import { Deserializer } from '../../deserialize/deserialize.js';
import { BreakStatement, ContinueStatement } from '../control/terminate.js';
import { VariableDeclarationNode } from '../declarations/declares.js';
import { ArrayPattern } from '../../definition/array.js';
import { ObjectPattern } from '../../definition/object.js';


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
	static visit(node: ForNode, visitNode: VisitNodeType): void {
		visitNode(node.body);
		node.init && visitNode(node.init);
		node.test && visitNode(node.test);
		node.update && visitNode(node.update);
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
	shareVariables(scopeList: Scope<any>[]): void {
		this.init?.shareVariables(scopeList);
		this.test?.shareVariables(scopeList);
		this.update?.shareVariables(scopeList);
		this.body.shareVariables(scopeList);
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
	dependency(computed?: true): ExpressionNode[] {
		let dependency: ExpressionNode[] = this.body.dependency(computed);
		this.init && (dependency = dependency.concat(this.init.dependency(computed)));
		this.test && (dependency = dependency.concat(this.test.dependency(computed)));
		this.update && (dependency = dependency.concat(this.update.dependency(computed)));
		return dependency;
	}
	dependencyPath(computed?: true): ExpressionEventPath[] {
		let dependencyPath: ExpressionEventPath[] = this.body.dependencyPath(computed);
		this.init && (dependencyPath = dependencyPath.concat(this.init.dependencyPath(computed)));
		this.test && (dependencyPath = dependencyPath.concat(this.test.dependencyPath(computed)));
		this.update && (dependencyPath = dependencyPath.concat(this.update.dependencyPath(computed)));
		return dependencyPath;
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

export type ForDeclaration = VariableDeclarationNode | ObjectPattern | ArrayPattern;

@Deserializer('ForOfStatement')
export class ForOfNode extends AbstractExpressionNode {
	static fromJSON(node: ForOfNode, deserializer: NodeDeserializer): ForOfNode {
		return new ForOfNode(
			deserializer(node.left) as ForDeclaration,
			deserializer(node.right),
			deserializer(node.body)
		);
	}
	static visit(node: ForOfNode, visitNode: VisitNodeType): void {
		visitNode(node.left);
		visitNode(node.right);
		visitNode(node.body);
	}
	constructor(
		private left: ForDeclaration,
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
	shareVariables(scopeList: Scope<any>[]): void {
		this.right.shareVariables(scopeList);
		this.body.shareVariables(scopeList);
	}
	set(stack: Stack, value: any) {
		throw new Error(`ForOfNode#set() has no implementation.`);
	}
	get(stack: Stack) {
		const iterable = <any[]>this.right.get(stack);
		for (const iterator of iterable) {
			const forBlock = stack.pushBlockScope();
			this.left.declareVariable(stack, iterator);
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
	dependency(computed?: true): ExpressionNode[] {
		return this.right.dependency(computed);
	}
	dependencyPath(computed?: true): ExpressionEventPath[] {
		return this.right.dependencyPath(computed);
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
			deserializer(node.left) as ForDeclaration,
			deserializer(node.right),
			deserializer(node.body)
		);
	}
	static visit(node: ForInNode, visitNode: VisitNodeType): void {
		visitNode(node.left);
		visitNode(node.right);
		visitNode(node.body);
	}
	// variable of iterable
	constructor(
		private left: VariableDeclarationNode | ObjectPattern | ArrayPattern,
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
	shareVariables(scopeList: Scope<any>[]): void {
		this.right.shareVariables(scopeList);
		this.body.shareVariables(scopeList);
	}
	set(stack: Stack, value: any) {
		throw new Error(`ForOfNode#set() has no implementation.`);
	}
	get(stack: Stack) {
		const iterable = <object>this.right.get(stack);
		for (const iterator in iterable) {
			const forBlock = stack.pushBlockScope();
			this.left.declareVariable(stack, iterator);
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
	dependency(computed?: true): ExpressionNode[] {
		return this.right.dependency(computed);
	}
	dependencyPath(computed?: true): ExpressionEventPath[] {
		return this.right.dependencyPath(computed);
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
			deserializer(node.left) as ForDeclaration,
			deserializer(node.right),
			deserializer(node.body)
		);
	}
	static visit(node: ForAwaitOfNode, visitNode: VisitNodeType): void {
		visitNode(node.left);
		visitNode(node.right);
		visitNode(node.body);
	}
	// variable of iterable
	constructor(
		private left: ForDeclaration,
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
	shareVariables(scopeList: Scope<any>[]): void {
		this.right.shareVariables(scopeList);
		this.body.shareVariables(scopeList);
	}
	set(stack: Stack, value: any) {
		throw new Error(`ForAwaitOfNode#set() has no implementation.`);
	}
	get(stack: Stack) {
		const iterable: AsyncIterable<any> = this.right.get(stack);
		const forAwaitBody = (iterator: any): any => {
			const forBlock = stack.pushBlockScope();
			this.left.declareVariable(stack, iterator);
			const result = this.body.get(stack);
			stack.clearTo(forBlock);
			return result;
		};
		stack.forAwaitAsyncIterable = { iterable, forAwaitBody };
	}
	dependency(computed?: true): ExpressionNode[] {
		return this.right.dependency(computed);
	}
	dependencyPath(computed?: true): ExpressionEventPath[] {
		return this.right.dependencyPath(computed);
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
