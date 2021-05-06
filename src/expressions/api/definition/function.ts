import type { ExpressionNode, NodeDeserializer } from '../expression.js';
import type { ScopedStack } from '../scope.js';
import { AbstractExpressionNode, AwaitPromise, ReturnValue } from '../abstract.js';
import { Deserializer } from '../deserialize/deserialize.js';
import { IdentifierNode } from './values.js';
import { TerminateNode } from '../statement/controlflow/terminate.js';

export enum FunctionType {
	NORMAL = 'NORMAL',						// 0
	ASYNC = 'ASYNC',						// 1
	GENERATOR = 'GENERATOR',				// 2
	ASYNC_GENERATOR = 'ASYNC_GENERATOR'		// 3
}
export enum ArrowFunctionType {
	NORMAL = 'NORMAL',
	ASYNC = 'ASYNC'
}

@Deserializer('paramter')
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
	set(stack: ScopedStack, value: Function) {
		this.identifier.set(stack, value || this.defaultValue?.get(stack));
	}
	get(stack: ScopedStack) {
		throw new Error('ParamterNode#get() has no implementation.');
	}
	entry(): string[] {
		return [];
	}
	event(): string[] {
		return [];
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

@Deserializer('function')
export class FunctionDeclarationNode extends AbstractExpressionNode {
	static fromJSON(node: FunctionDeclarationNode, deserializer: NodeDeserializer): FunctionDeclarationNode {
		return new FunctionDeclarationNode(
			node.parameters.map(deserializer),
			node.statements.map(deserializer),
			FunctionType[node.type],
			node.name ? deserializer(node.name) as IdentifierNode : void 0,
			node.rest
		);
	}
	constructor(
		private parameters: ExpressionNode[], private statements: ExpressionNode[],
		private type: FunctionType, private name?: ExpressionNode, private rest?: boolean) {
		super();
	}
	getParameters() {
		return this.parameters;
	}
	getStatements() {
		return this.statements;
	}
	getType() {
		return this.type;
	}
	getName() {
		return this.name;
	}
	set(stack: ScopedStack, value: Function) {
		throw new Error('FunctionDeclarationNode#set() has no implementation.');
	}
	private setParamter(stack: ScopedStack, args: any[]) {
		const limit = this.rest ? this.parameters.length - 1 : this.parameters.length;
		for (let i = 0; i < limit; i++) {
			this.parameters[i].set(stack, args[i]);
		}
		if (this.rest) {
			this.parameters[limit].set(stack, args.slice(limit));
		}
	}
	get(stack: ScopedStack) {
		const self = this;
		let func: Function;
		switch (this.type) {
			case FunctionType.ASYNC:
				func = async function (this: any, ...args: any[]) {
					const funcStack = stack.newStack();
					funcStack.localScop.set('this', this);
					self.setParamter(funcStack, args);
					let returnValue: any;
					for (const state of self.statements) {
						returnValue = state.get(funcStack);
						if (funcStack.awaitPromise.length > 0) {
							for (const awaitRef of funcStack.awaitPromise) {
								const awaitValue = await awaitRef.promise;
								awaitRef.node.set(funcStack, awaitValue);
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
			case FunctionType.GENERATOR:
				func = function* (this: any, ...args: any[]) {
					const funcStack = stack.newStack();
					funcStack.localScop.set('this', this);
					self.setParamter(funcStack, args);
					let returnValue: any;
					for (const state of self.statements) {
						returnValue = state.get(funcStack);
						if (returnValue instanceof ReturnValue) {
							return returnValue.value;
						}
					}
				};
				break;
			case FunctionType.ASYNC_GENERATOR:
				func = async function* (this: any, ...args: any[]) {
					const funcStack = stack.newStack();
					funcStack.localScop.set('this', this);
					self.setParamter(funcStack, args);
					let returnValue: any;
					for (const state of self.statements) {
						returnValue = state.get(funcStack);
						if (funcStack.awaitPromise.length > 0) {
							for (const awaitRef of funcStack.awaitPromise) {
								const awaitValue = await awaitRef.promise;
								awaitRef.node.set(funcStack, awaitValue);
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
			case FunctionType.NORMAL:
				func = function (this: any, ...args: any[]) {
					const funcStack = stack.newStack();
					funcStack.localScop.set('this', this);
					self.setParamter(funcStack, args);
					let returnValue: any;
					for (const state of self.statements) {
						returnValue = state.get(funcStack);
						if (returnValue instanceof ReturnValue) {
							return returnValue.value;
						}
					}
				};
				break;
		}
		if (this.name) {
			this.name.set(stack, func);
		}
		return func;
	}
	entry(): string[] {
		return [
			...this.parameters.flatMap(param => param.entry()),
			/** remove for now, should return only object not defined in this function scope */
			// ...this.funcBody.flatMap(line => line.entry())
		];
	}
	event(): string[] {
		return this.statements.flatMap(item => item.event());
	}
	toString(): string {
		let declare: string;
		switch (this.type) {
			case FunctionType.ASYNC:
				declare = 'async function'; break;
			case FunctionType.GENERATOR:
				declare = 'function*'; break;
			case FunctionType.ASYNC_GENERATOR:
				declare = 'async function*'; break;
			default:
			case FunctionType.NORMAL:
				declare = 'function'; break;
		}
		return `${declare} ${this.name?.toString() || ''}(${this.parameters.map((param, index, array) => {
			if (index === array.length - 1 && this.rest) {
				return '...' + param.toString();
			} else {
				return param.toString();
			}
		}).join(', ')}) ${this.statements.toString()}`;
	}
	toJson(): object {
		return {
			parameters: this.parameters.map(param => param.toJSON()),
			statements: this.statements.map(statement => statement.toJSON()),
			type: this.type,
			name: this.name?.toJSON(),
			rest: this.rest
		};
	}
}


@Deserializer('arrow')
export class ArrowFunctionNode extends AbstractExpressionNode {
	static fromJSON(node: ArrowFunctionNode, deserializer: NodeDeserializer): ArrowFunctionNode {
		return new ArrowFunctionNode(
			node.parameters.map(deserializer),
			node.statements.map(deserializer),
			ArrowFunctionType[node.type],
			node.rest
		);
	}
	constructor(private parameters: ExpressionNode[], private statements: ExpressionNode[],
		private type: ArrowFunctionType, private rest?: boolean) {
		super();
	}
	getParameters() {
		return this.parameters;
	}
	getStatements() {
		return this.statements;
	}
	set(stack: ScopedStack, value: Function) {
		throw new Error('FunctionDeclarationNode#set() has no implementation.');
	}
	private setParamter(stack: ScopedStack, args: any[]) {
		const limit = this.rest ? this.parameters.length - 1 : this.parameters.length;
		for (let i = 0; i < limit; i++) {
			this.parameters[i].set(stack, args[i]);
		}
		if (this.rest) {
			this.parameters[limit].set(stack, args.slice(limit));
		}
	}
	get(stack: ScopedStack) {
		let func: Function;
		switch (this.type) {
			case ArrowFunctionType.ASYNC:
				func = async (...args: any[]) => {
					const funcStack = stack.newStack();
					this.setParamter(funcStack, args);
					let returnValue: any;
					for (const state of this.statements) {
						returnValue = state.get(funcStack);
						if (funcStack.awaitPromise.length > 0) {
							for (const awaitRef of funcStack.awaitPromise) {
								const awaitValue = await awaitRef.promise;
								awaitRef.node.set(funcStack, awaitValue);
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
					for (const state of this.statements) {
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
			...this.parameters.flatMap(param => param.entry()),
			/** remove for now, should return only object not defined in this function scope */
			// ...this.funcBody.flatMap(line => line.entry())
		];
	}
	event(): string[] {
		return this.statements.flatMap(statement => statement.event());
	}
	toString(): string {
		let str = this.type === ArrowFunctionType.ASYNC ? 'async ' : '';
		if (this.parameters.length === 0) {
			str += '()';
		} else if (this.parameters.length === 1) {
			str += this.parameters[0].toString();
		} else {
			str += '(';
			str += this.parameters.map((param, index, array) => {
				if (index === array.length - 1 && this.rest) {
					return '...' + param.toString();
				} else {
					return param.toString();
				}
			}).join(', ');
			str += ')';
		}
		str += ' => ';
		str += this.statements.toString();
		return str;
	}
	toJson(): object {
		return {
			parameters: this.parameters.map(param => param.toJSON()),
			statements: this.statements.map(item => item.toJSON()),
			type: this.type,
			rest: this.rest
		};
	}
}
