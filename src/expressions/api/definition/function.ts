import type { ExpressionNode, NodeDeserializer } from '../expression.js';
import type { Stack } from '../scope.js';
import { AbstractExpressionNode, AwaitPromise, ReturnValue } from '../abstract.js';
import { Deserializer } from '../deserialize/deserialize.js';
import { IdentifierNode } from './values.js';
import { TerminateNode } from '../statement/controlflow/terminate.js';

export enum FunctionKind {
	NORMAL = 'NORMAL',
	ASYNC = 'ASYNC',
	GENERATOR = 'GENERATOR',
	ASYNC_GENERATOR = 'ASYNC_GENERATOR',

	CONCISE = 'CONCISE',
	ASYNC_CONCISE = 'ASYNC_CONCISE',
	CONCISE_GENERATOR = 'CONCISE_GENERATOR',
	ASYNC_CONCISE_GENERATOR = 'ASYNC_CONCISE_GENERATOR',

	STATIC_CONCISE = 'STATIC_CONCISE',
	STATIC_ASYNC_CONCISE = 'STATIC_ASYNC_CONCISE',
	STATIC_CONCISE_GENERATOR = 'STATIC_CONCISE_GENERATOR',
	STATIC_ASYNC_CONCISE_GENERATOR = 'STATIC_ASYNC_CONCISE_GENERATOR',

	DERIVED_CONSTRUCTOR = 'DERIVED_CONSTRUCTOR',
	BASE_CONSTRUCTOR = 'BASE_CONSTRUCTOR',

}
export enum ArrowFunctionType {
	NORMAL = 'NORMAL',
	ASYNC = 'ASYNC'
}

@Deserializer('Paramter')
export class FormalParamterNode extends AbstractExpressionNode {
	static fromJSON(node: FormalParamterNode, deserializer: NodeDeserializer): FormalParamterNode {
		return new FormalParamterNode(
			deserializer(node.identifier),
			node.defaultValue ? deserializer(node.defaultValue) as IdentifierNode : void 0
		);
	}
	constructor(private identifier: ExpressionNode, private defaultValue?: ExpressionNode) {
		super();
	}
	getIdentifier() {
		return this.identifier;
	}
	getDefaultValue() {
		return this.defaultValue;
	}
	set(stack: Stack, value: Function) {
		this.identifier.set(stack, value || this.defaultValue?.get(stack));
	}
	get(stack: Stack) {
		throw new Error('ParamterNode#get() has no implementation.');
	}
	entry(): string[] {
		return this.identifier.entry().concat(this.defaultValue?.entry() || []);
	}
	event(): string[] {
		return this.identifier.event().concat(this.defaultValue?.event() || []);
	}
	toString(): string {
		let init = this.defaultValue ? (' = ' + this.defaultValue.toString()) : '';
		return this.identifier.toString() + init;
	}
	toJson(): object {
		return {
			identifier: this.identifier.toJSON(),
			defaultValue: this.defaultValue?.toJSON()
		};
	}
}

@Deserializer('FunctionExpression')
export class FunctionExpressionNode extends AbstractExpressionNode {
	static fromJSON(node: FunctionExpressionNode, deserializer: NodeDeserializer): FunctionExpressionNode {
		return new FunctionExpressionNode(
			node.params.map(deserializer),
			node.body.map(deserializer),
			FunctionKind[node.kind],
			node.id ? deserializer(node.id) as IdentifierNode : void 0,
			node.rest,
			node.generator
		);
	}
	constructor(
		protected params: ExpressionNode[], protected body: ExpressionNode[],
		protected kind: FunctionKind, protected id?: ExpressionNode,
		protected rest?: boolean, protected generator?: boolean) {
		super();
	}
	getParams() {
		return this.params;
	}
	getBody() {
		return this.body;
	}
	getKind() {
		return this.kind;
	}
	getId() {
		return this.id;
	}
	getRest() {
		return this.rest;
	}
	set(stack: Stack, value: Function) {
		throw new Error('FunctionExpressionNode#set() has no implementation.');
	}
	private setParamter(stack: Stack, args: any[]) {
		const limit = this.rest ? this.params.length - 1 : this.params.length;
		for (let i = 0; i < limit; i++) {
			this.params[i].set(stack, args[i]);
		}
		if (this.rest) {
			this.params[limit].set(stack, args.slice(limit));
		}
	}
	get(stack: Stack) {
		const self = this;
		let func: Function;
		switch (this.kind) {
			case FunctionKind.ASYNC:
				func = async function (this: ThisType<any>, ...args: any[]) {
					const funcStack = stack.newStack();
					funcStack.localScop.set('this', this);
					self.setParamter(funcStack, args);
					let returnValue: any;
					for (const state of self.body) {
						returnValue = state.get(funcStack);
						if (funcStack.awaitPromise.length > 0) {
							for (const awaitRef of funcStack.awaitPromise) {
								const awaitValue = await awaitRef.promise;
								if (awaitRef.declareVariable) {
									awaitRef.node.declareVariable(funcStack, awaitRef.scopeType, awaitValue);
								} else {
									awaitRef.node.set(funcStack, awaitValue);
								}
							}
							funcStack.awaitPromise.splice(0);
						}
						else if (funcStack.forAwaitAsyncIterable) {
							for await (let iterator of funcStack.forAwaitAsyncIterable.iterable) {
								const result = funcStack.forAwaitAsyncIterable.forAwaitBody(iterator);
								if (TerminateNode.ContinueSymbol === result) {
									continue;
								}
								else if (TerminateNode.BreakSymbol === result) {
									break;
								}
								else if (result instanceof ReturnValue) {
									returnValue = result;
									break;
								}
							}
							funcStack.forAwaitAsyncIterable = undefined;
						}
						if (returnValue instanceof ReturnValue) {
							returnValue = returnValue.value;
							if (returnValue instanceof AwaitPromise) {
								returnValue = await returnValue.promise;
								return returnValue;
							}
						}
					}
				};
				break;
			case FunctionKind.GENERATOR:
				func = function* (this: ThisType<any>, ...args: any[]) {
					const funcStack = stack.newStack();
					funcStack.localScop.set('this', this);
					self.setParamter(funcStack, args);
					let returnValue: any;
					for (const state of self.body) {
						returnValue = state.get(funcStack);
						if (returnValue instanceof ReturnValue) {
							return returnValue.value;
						}
					}
				};
				break;
			case FunctionKind.ASYNC_GENERATOR:
				func = async function* (this: ThisType<any>, ...args: any[]) {
					const funcStack = stack.newStack();
					funcStack.localScop.set('this', this);
					self.setParamter(funcStack, args);
					let returnValue: any;
					for (const state of self.body) {
						returnValue = state.get(funcStack);
						if (funcStack.awaitPromise.length > 0) {
							for (const awaitRef of funcStack.awaitPromise) {
								const awaitValue = await awaitRef.promise;
								if (awaitRef.declareVariable) {
									awaitRef.node.declareVariable(funcStack, awaitRef.scopeType, awaitValue);
								} else {
									awaitRef.node.set(funcStack, awaitValue);
								}
							}
							funcStack.awaitPromise.splice(0);
						}
						else if (funcStack.forAwaitAsyncIterable) {
							for await (let iterator of funcStack.forAwaitAsyncIterable.iterable) {
								const result = funcStack.forAwaitAsyncIterable.forAwaitBody(iterator);
								if (TerminateNode.ContinueSymbol === result) {
									continue;
								}
								else if (TerminateNode.BreakSymbol === result) {
									break;
								}
								else if (result instanceof ReturnValue) {
									returnValue = result;
									break;
								}
							}
							funcStack.forAwaitAsyncIterable = undefined;
						}
						if (returnValue instanceof ReturnValue) {
							returnValue = returnValue.value;
							if (returnValue instanceof AwaitPromise) {
								return await returnValue.promise;
							}
						}
					}
				};
				break;
			default:
			case FunctionKind.NORMAL:
				func = function (this: ThisType<any>, ...args: any[]) {
					const funcStack = stack.newStack();
					funcStack.localScop.set('this', this);
					self.setParamter(funcStack, args);
					let returnValue: any;
					for (const state of self.body) {
						returnValue = state.get(funcStack);
						if (returnValue instanceof ReturnValue) {
							return returnValue.value;
						}
					}
				};
				break;
		}
		if (this.id) {
			this.id.set(stack, func);
		}
		return func;
	}
	entry(): string[] {
		return [
			...this.params.flatMap(param => param.entry()),
			/** remove for now, should return only object not defined in this function scope */
			// ...this.statements.flatMap(statement => statement.entry())
		];
	}
	event(): string[] {
		// return this.statements.flatMap(item => item.event());
		return [
			...this.params.flatMap(param => param.event()),
			/** remove for now, should return only object not defined in this function scope */
			// ...this.statements.flatMap(statement => statement.entry())
		];
	}
	toString(): string {
		let declare: string;
		switch (this.kind) {
			case FunctionKind.ASYNC:
				declare = 'async function'; break;
			case FunctionKind.GENERATOR:
				declare = 'function*'; break;
			case FunctionKind.ASYNC_GENERATOR:
				declare = 'async function*'; break;
			default:
			case FunctionKind.NORMAL:
				declare = 'function'; break;
		}
		return `${declare} ${this.id?.toString() || ''}(${this.params.map((param, index, array) => {
			if (index === array.length - 1 && this.rest) {
				return '...' + param.toString();
			} else {
				return param.toString();
			}
		}).join(', ')}) ${this.body.toString()}`;
	}
	toJson(): object {
		return {
			params: this.params.map(param => param.toJSON()),
			body: this.body.map(statement => statement.toJSON()),
			kind: this.kind,
			id: this.id?.toJSON(),
			rest: this.rest,
			generator: this.generator
		};
	}
}

@Deserializer('FunctionDeclaration')
export class FunctionDeclarationNode extends FunctionExpressionNode {
	static fromJSON(node: FunctionDeclarationNode, deserializer: NodeDeserializer): FunctionDeclarationNode {
		return new FunctionDeclarationNode(
			node.params.map(deserializer),
			node.body.map(deserializer),
			FunctionKind[node.kind],
			deserializer(node.id!),
			node.rest,
			node.generator
		);
	}
	constructor(
		params: ExpressionNode[], body: ExpressionNode[],
		kind: FunctionKind, id: ExpressionNode,
		rest?: boolean, generator?: boolean) {
		super(params, body, kind, id, rest, generator);
	}
}


@Deserializer('ArrowFunctionExpression')
export class ArrowFunctionNode extends AbstractExpressionNode {
	static fromJSON(node: ArrowFunctionNode, deserializer: NodeDeserializer): ArrowFunctionNode {
		return new ArrowFunctionNode(
			node.params.map(deserializer),
			node.body.map(deserializer),
			ArrowFunctionType[node.kind],
			node.rest,
			node.generator
		);
	}
	constructor(private params: ExpressionNode[], private body: ExpressionNode[],
		private kind: ArrowFunctionType, private rest?: boolean, private generator?: boolean) {
		super();
	}
	getParams() {
		return this.params;
	}
	getBody() {
		return this.body;
	}
	getRest() {
		return this.rest;
	}
	set(stack: Stack, value: Function) {
		throw new Error('ArrowFunctionNode#set() has no implementation.');
	}
	private setParamter(stack: Stack, args: any[]) {
		const limit = this.rest ? this.params.length - 1 : this.params.length;
		for (let i = 0; i < limit; i++) {
			this.params[i].set(stack, args[i]);
		}
		if (this.rest) {
			this.params[limit].set(stack, args.slice(limit));
		}
	}
	get(stack: Stack) {
		let func: Function;
		switch (this.kind) {
			case ArrowFunctionType.ASYNC:
				func = async (...args: any[]) => {
					const funcStack = stack.newStack();
					this.setParamter(funcStack, args);
					let returnValue: any;
					for (const state of this.body) {
						returnValue = state.get(funcStack);
						if (funcStack.awaitPromise.length > 0) {
							for (const awaitRef of funcStack.awaitPromise) {
								const awaitValue = await awaitRef.promise;
								if (awaitRef.declareVariable) {
									awaitRef.node.declareVariable(funcStack, awaitRef.scopeType, awaitValue);
								} else {
									awaitRef.node.set(funcStack, awaitValue);
								}
							}
							funcStack.awaitPromise.splice(0);
						}
						else if (funcStack.forAwaitAsyncIterable) {
							for await (let iterator of funcStack.forAwaitAsyncIterable.iterable) {
								const result = funcStack.forAwaitAsyncIterable.forAwaitBody(iterator);
								if (TerminateNode.ContinueSymbol === result) {
									continue;
								}
								else if (TerminateNode.BreakSymbol === result) {
									break;
								}
								else if (result instanceof ReturnValue) {
									returnValue = result;
									break;
								}
							}
							funcStack.forAwaitAsyncIterable = undefined;
						}
						if (returnValue instanceof ReturnValue) {
							returnValue = returnValue.value;
							if (returnValue instanceof AwaitPromise) {
								return await returnValue.promise;
							}
						}
					}
				};
				break;
			default:
			case ArrowFunctionType.NORMAL:
				func = (...args: any[]) => {
					const funcStack = stack.newStack();
					this.setParamter(funcStack, args);
					let returnValue: any;
					for (const state of this.body) {
						returnValue = state.get(funcStack);
						if (returnValue instanceof ReturnValue) {
							return returnValue.value;
						}
					}
				};
				break;
		}
		return func;
	}
	entry(): string[] {
		return [
			...this.params.flatMap(param => param.entry()),
			/** remove for now, should return only object not defined in this function scope */
			// ...this.statements.flatMap(statement => statement.entry())
		];
	}
	event(): string[] {
		// return this.statements.flatMap(statement => statement.event());
		return [
			...this.params.flatMap(param => param.event()),
			/** remove for now, should return only object not defined in this function scope */
			// ...this.statements.flatMap(statement => statement.entry())
		];
	}
	toString(): string {
		let str = this.kind === ArrowFunctionType.ASYNC ? 'async ' : '';
		if (this.params.length === 0) {
			str += '()';
		} else if (this.params.length === 1) {
			str += this.params[0].toString();
		} else {
			str += '(';
			str += this.params.map((param, index, array) => {
				if (index === array.length - 1 && this.rest) {
					return '...' + param.toString();
				} else {
					return param.toString();
				}
			}).join(', ');
			str += ')';
		}
		str += ' => ';
		str += this.body.toString();
		return str;
	}
	toJson(): object {
		return {
			params: this.params.map(param => param.toJSON()),
			body: this.body.map(item => item.toJSON()),
			expression: true,
			kind: this.kind,
			rest: this.rest,
			generator: this.generator
		};
	}
}
