import type { CanDeclareExpression, ExpressionNode, NodeDeserializer } from '../expression.js';
import type { Stack } from '../../scope/stack.js';
import { Scope } from '../../scope/scope.js';
import { AbstractExpressionNode, AwaitPromise, ReturnValue } from '../abstract.js';
import { Deserializer } from '../deserialize/deserialize.js';
import { Identifier } from './values.js';
import { BreakStatement, ContinueStatement } from '../statement/control/terminate.js';

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

@Deserializer('Param')
export class Param extends AbstractExpressionNode {
	static fromJSON(node: Param, deserializer: NodeDeserializer): Param {
		return new Param(
			deserializer(node.identifier),
			node.defaultValue ? deserializer(node.defaultValue) as Identifier : void 0
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
	shareVariables(scopeList: Scope<any>[]): void {
		this.defaultValue?.shareVariables(scopeList);
	}
	set(stack: Stack, value: Function) {
		this.identifier.set(stack, value || this.defaultValue?.get(stack));
	}
	get(stack: Stack) {
		throw new Error('Param#get() has no implementation.');
	}
	events(): string[] {
		return this.identifier.events().concat(this.defaultValue?.events() || []);
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

export abstract class FunctionBaseExpression extends AbstractExpressionNode {
	private sharedVariables: Scope<any>[];
	shareVariables(scopeList: Scope<any>[]): void {
		this.sharedVariables = scopeList;
	}
	initFunctionScope(stack: Stack) {
		const scope = Scope.functionScope<object>();
		const innerScopes = this.sharedVariables ? this.sharedVariables.slice() : [];
		innerScopes.push(scope);
		innerScopes.forEach(variableScope => stack.pushScope(variableScope));
		return innerScopes;
	}
	clearFunctionScope(stack: Stack, innerScopes: Scope<any>[]) {
		stack.clearTo(innerScopes[0]);
	}
}

@Deserializer('FunctionExpression')
export class FunctionExpression extends FunctionBaseExpression {
	static fromJSON(node: FunctionExpression, deserializer: NodeDeserializer): FunctionExpression {
		return new FunctionExpression(
			node.params.map(deserializer),
			node.body.map(deserializer),
			FunctionKind[node.kind],
			node.id ? deserializer(node.id) as Identifier : void 0,
			node.rest,
			node.generator
		);
	}
	constructor(
		protected params: ExpressionNode[], protected body: ExpressionNode[],
		protected kind: FunctionKind, protected id?: CanDeclareExpression,
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
		throw new Error(`${this.constructor.name}#set() has no implementation.`);
	}
	private setParameter(stack: Stack, args: any[]) {
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
				func = async function (this: any, ...args: any[]) {
					const innerScopes = self.initFunctionScope(stack);
					stack.declareVariable('function', 'this', this);
					self.setParameter(stack, args);
					let returnValue: any;
					for (const statement of self.body) {
						statement.shareVariables(innerScopes);
						returnValue = statement.get(stack);
						if (stack.awaitPromise.length > 0) {
							for (const awaitRef of stack.awaitPromise) {
								const awaitValue = await awaitRef.promise;
								if (awaitRef.declareVariable) {
									awaitRef.node.declareVariable(stack, awaitRef.scopeType, awaitValue);
								} else {
									awaitRef.node.set(stack, awaitValue);
								}
							}
							stack.awaitPromise.splice(0);
						}
						else if (stack.forAwaitAsyncIterable) {
							for await (let iterator of stack.forAwaitAsyncIterable.iterable) {
								const result = stack.forAwaitAsyncIterable.forAwaitBody(iterator);
								if (ContinueStatement.ContinueSymbol === result) {
									continue;
								}
								else if (BreakStatement.BreakSymbol === result) {
									break;
								}
								else if (result instanceof ReturnValue) {
									returnValue = result;
									break;
								}
							}
							stack.forAwaitAsyncIterable = undefined;
						}
						if (returnValue instanceof ReturnValue) {
							returnValue = returnValue.value;
							if (returnValue instanceof AwaitPromise) {
								returnValue = await returnValue.promise;
								self.clearFunctionScope(stack, innerScopes);
								return returnValue;
							}
						}
					}
					self.clearFunctionScope(stack, innerScopes);
				};
				break;
			case FunctionKind.GENERATOR:
				func = function* (this: any, ...args: any[]) {
					const innerScopes = self.initFunctionScope(stack);
					stack.declareVariable('function', 'this', this);
					self.setParameter(stack, args);
					let returnValue: any;
					for (const statement of self.body) {
						statement.shareVariables(innerScopes);
						returnValue = statement.get(stack);
						if (returnValue instanceof ReturnValue) {
							self.clearFunctionScope(stack, innerScopes);
							return returnValue.value;
						}
					}
					self.clearFunctionScope(stack, innerScopes);
				};
				break;
			case FunctionKind.ASYNC_GENERATOR:
				func = async function* (this: any, ...args: any[]) {
					const innerScopes = self.initFunctionScope(stack);
					stack.declareVariable('function', 'this', this);
					self.setParameter(stack, args);
					let returnValue: any;
					for (const statement of self.body) {
						statement.shareVariables(innerScopes);
						returnValue = statement.get(stack);
						if (stack.awaitPromise.length > 0) {
							for (const awaitRef of stack.awaitPromise) {
								const awaitValue = await awaitRef.promise;
								if (awaitRef.declareVariable) {
									awaitRef.node.declareVariable(stack, awaitRef.scopeType, awaitValue);
								} else {
									awaitRef.node.set(stack, awaitValue);
								}
							}
							stack.awaitPromise.splice(0);
						}
						else if (stack.forAwaitAsyncIterable) {
							for await (let iterator of stack.forAwaitAsyncIterable.iterable) {
								const result = stack.forAwaitAsyncIterable.forAwaitBody(iterator);
								if (ContinueStatement.ContinueSymbol === result) {
									continue;
								}
								else if (BreakStatement.BreakSymbol === result) {
									break;
								}
								else if (result instanceof ReturnValue) {
									self.clearFunctionScope(stack, innerScopes);
									returnValue = returnValue.value;
									if (returnValue instanceof AwaitPromise) {
										return await returnValue.promise;
									}
									return returnValue;
								}
							}
							stack.forAwaitAsyncIterable = undefined;
						}
						if (returnValue instanceof ReturnValue) {
							returnValue = returnValue.value;
							if (returnValue instanceof AwaitPromise) {
								return await returnValue.promise;
							}
							return returnValue;
						}
					}
					self.clearFunctionScope(stack, innerScopes);
				};
				break;
			default:
			case FunctionKind.NORMAL:
				func = function (this: any, ...args: any[]) {
					const innerScopes = self.initFunctionScope(stack);
					stack.declareVariable('function', 'this', this);
					self.setParameter(stack, args);
					let returnValue: any;
					for (const statement of self.body) {
						statement.shareVariables(innerScopes);
						returnValue = statement.get(stack);
						if (returnValue instanceof ReturnValue) {
							self.clearFunctionScope(stack, innerScopes);
							return returnValue.value;
						}
					}
					self.clearFunctionScope(stack, innerScopes);
				};
				break;
		}
		this.id?.declareVariable(stack, 'block', func);
		return func;
	}
	events(): string[] {
		return [
			...this.params.flatMap(param => param.events()),
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
export class FunctionDeclaration extends FunctionExpression {
	static fromJSON(node: FunctionDeclaration, deserializer: NodeDeserializer): FunctionDeclaration {
		return new FunctionDeclaration(
			node.params.map(deserializer),
			node.body.map(deserializer),
			FunctionKind[node.kind],
			deserializer(node.id!) as CanDeclareExpression,
			node.rest,
			node.generator
		);
	}
	constructor(
		params: ExpressionNode[], body: ExpressionNode[],
		kind: FunctionKind, id: CanDeclareExpression,
		rest?: boolean, generator?: boolean) {
		super(params, body, kind, id, rest, generator);
	}
}


@Deserializer('ArrowFunctionExpression')
export class ArrowFunctionExpression extends FunctionBaseExpression {
	static fromJSON(node: ArrowFunctionExpression, deserializer: NodeDeserializer): ArrowFunctionExpression {
		return new ArrowFunctionExpression(
			node.params.map(deserializer),
			Array.isArray(node.body)
				? node.body.map(deserializer)
				: deserializer(node.body),
			ArrowFunctionType[node.kind],
			node.rest,
			node.generator
		);
	}
	constructor(private params: ExpressionNode[], private body: ExpressionNode | ExpressionNode[],
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
		throw new Error('ArrowFunctionExpression#set() has no implementation.');
	}
	private setParameter(stack: Stack, args: any[]) {
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
					const innerScopes = this.initFunctionScope(stack);
					this.setParameter(stack, args);
					let returnValue: any;
					const statements = Array.isArray(this.body) ? this.body : [this.body];
					for (const state of statements) {
						state.shareVariables(innerScopes);
						returnValue = state.get(stack);
						if (stack.awaitPromise.length > 0) {
							for (const awaitRef of stack.awaitPromise) {
								const awaitValue = await awaitRef.promise;
								if (awaitRef.declareVariable) {
									awaitRef.node.declareVariable(stack, awaitRef.scopeType, awaitValue);
								} else {
									awaitRef.node.set(stack, awaitValue);
								}
							}
							stack.awaitPromise.splice(0);
						}
						else if (stack.forAwaitAsyncIterable) {
							for await (let iterator of stack.forAwaitAsyncIterable.iterable) {
								const result = stack.forAwaitAsyncIterable.forAwaitBody(iterator);
								if (ContinueStatement.ContinueSymbol === result) {
									continue;
								}
								else if (BreakStatement.BreakSymbol === result) {
									break;
								}
								else if (result instanceof ReturnValue) {
									returnValue = result;
									break;
								}
							}
							stack.forAwaitAsyncIterable = undefined;
						}
						if (returnValue instanceof ReturnValue) {
							returnValue = returnValue.value;
							if (returnValue instanceof AwaitPromise) {
								this.clearFunctionScope(stack, innerScopes);
								return await returnValue.promise;
							}
						}
					}
					this.clearFunctionScope(stack, innerScopes);
					if (!Array.isArray(this.body)) {
						return returnValue;
					}
				};
				break;
			default:
			case ArrowFunctionType.NORMAL:
				func = (...args: any[]) => {
					const innerScopes = this.initFunctionScope(stack);
					this.setParameter(stack, args);
					let returnValue: any;
					const statements = Array.isArray(this.body) ? this.body : [this.body];
					for (const statement of statements) {
						statement.shareVariables(innerScopes);
						returnValue = statement.get(stack);
						if (returnValue instanceof ReturnValue) {
							this.clearFunctionScope(stack, innerScopes);
							return returnValue.value;
						}
					}
					this.clearFunctionScope(stack, innerScopes);
					if (!Array.isArray(this.body)) {
						return returnValue;
					}
				};
				break;
		}
		return func;
	}
	events(): string[] {
		return [
			...this.params.flatMap(param => param.events()),
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
			body: Array.isArray(this.body) ? this.body.map(item => item.toJSON()) : this.body.toJSON(),
			expression: true,
			kind: this.kind,
			rest: this.rest,
			generator: this.generator
		};
	}
}
