import type {
	DeclarationExpression, ExpressionEventPath, ExpressionNode,
	NodeDeserializer, VisitNodeType
} from '../expression.js';
import { Stack } from '../../scope/stack.js';
import { Scope } from '../../scope/scope.js';
import {
	AbstractExpressionNode, AwaitPromise, ReturnValue,
	YieldDelegateValue, YieldValue
} from '../abstract.js';
import { Deserializer } from '../deserialize/deserialize.js';
import { Identifier } from './values.js';
import { TerminateReturnType } from '../statement/control/terminate.js';
import { RestElement } from '../computing/rest.js';
import { BlockStatement } from '../statement/control/block.js';

@Deserializer('Param')
export class Param extends AbstractExpressionNode {
	static fromJSON(node: Param, deserializer: NodeDeserializer): Param {
		return new Param(
			deserializer(node.identifier) as DeclarationExpression,
			node.defaultValue ? deserializer(node.defaultValue) as Identifier : void 0
		);
	}
	static visit(node: Param, visitNode: VisitNodeType): void {
		visitNode(node.identifier);
		node.defaultValue && visitNode(node.defaultValue);
	}
	constructor(private identifier: DeclarationExpression, private defaultValue?: ExpressionNode) {
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
		this.identifier.declareVariable?.(stack, value);
	}
	get(stack: Stack) {
		throw new Error('Param#get() has no implementation.');
	}
	dependency(computed?: true): ExpressionNode[] {
		return this.defaultValue ? [this.defaultValue] : [];
	}
	dependencyPath(computed?: true): ExpressionEventPath[] {
		return this.defaultValue?.dependencyPath(computed) || [];
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

export abstract class BaseFunctionExpression extends AbstractExpressionNode {
	private sharedVariables: Scope<any>[];
	shareVariables(scopeList: Scope<any>[]): void {
		this.sharedVariables = scopeList;
	}
	initFunctionScope(stack: Stack) {
		const scope = Scope.blockScope<object>();
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
export class FunctionExpression extends BaseFunctionExpression {
	static fromJSON(node: FunctionExpression, deserializer: NodeDeserializer): FunctionExpression {
		return new FunctionExpression(
			node.params.map(deserializer),
			deserializer(node.body),
			node.async,
			node.generator,
			node.id ? deserializer(node.id) as Identifier : void 0,
		);
	}
	static visit(node: FunctionExpression, visitNode: VisitNodeType): void {
		node.id && visitNode(node.id);
		node.params.forEach(visitNode);
		visitNode(node.body);
	}
	constructor(
		protected params: ExpressionNode[], protected body: ExpressionNode,
		protected async: boolean, protected generator: boolean,
		protected id?: Identifier,
	) {
		super();
	}
	getParams() {
		return this.params;
	}
	getBody() {
		return this.body;
	}
	getGenerator() {
		return this.generator;
	}
	getId() {
		return this.id;
	}
	getAsync() {
		return this.async;
	}
	set(stack: Stack, value: Function) {
		throw new Error(`${this.constructor.name}#set() has no implementation.`);
	}
	setParameter(stack: Stack, args: any[]) {
		const rest = this.params[this.params.length - 1] instanceof RestElement;
		const limit = rest ? this.params.length - 1 : this.params.length;
		for (let i = 0; i < limit; i++) {
			this.params[i].set(stack, args[i]);
		}
		if (rest) {
			this.params[limit].set(stack, args.slice(limit));
		}
	}
	get(stack: Stack) {
		let func: Function;
		if (this.async && this.generator) {
			func = this.getAsyncGeneratorFunction(stack);
		} else if (this.async) {
			func = this.getAsyncFunction(stack);
		} else if (this.generator) {
			func = this.getGeneratorFunction(stack);
		} else {
			func = this.getFunction(stack);
		}
		// this.id?.declareVariable(stack, func);
		return func;
	}
	private getAsyncFunction(stack: Stack) {
		const self = this;
		return async function (this: any, ...args: any[]) {
			const innerScopes = self.initFunctionScope(stack);
			stack.declareVariable('this', this);
			self.setParameter(stack, args);
			let returnValue: any;
			const statements = (self.body as BlockStatement).getBody();
			for (const statement of statements) {
				statement.shareVariables(innerScopes);
				returnValue = statement.get(stack);
				if (stack.awaitPromise?.length > 0) {
					for (const awaitRef of stack.awaitPromise) {
						const awaitValue = await awaitRef.promise;
						if (awaitRef.declareVariable) {
							awaitRef.node.declareVariable(stack, awaitValue);
						} else {
							awaitRef.node.set(stack, awaitValue);
						}
					}
					stack.awaitPromise.splice(0);
				}
				else if (stack.forAwaitAsyncIterable) {
					for await (let iterator of stack.forAwaitAsyncIterable.iterable) {
						const result = stack.forAwaitAsyncIterable.forAwaitBody(iterator);
						if (result instanceof TerminateReturnType) {
							if (result.type === 'continue') {
								continue;
							} else {
								break;
							}
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
					}
					self.clearFunctionScope(stack, innerScopes);
					return returnValue;
				}
			}
			self.clearFunctionScope(stack, innerScopes);
		};

	}
	private getGeneratorFunction(stack: Stack) {
		const self = this;
		return function* (this: any, ...args: any[]) {
			const innerScopes = self.initFunctionScope(stack);
			stack.declareVariable('this', this);
			self.setParameter(stack, args);
			let returnValue: any;
			const statements = (self.body as BlockStatement).getBody();
			for (const statement of statements) {
				statement.shareVariables(innerScopes);
				returnValue = statement.get(stack);
				if (returnValue instanceof ReturnValue) {
					self.clearFunctionScope(stack, innerScopes);
					return returnValue.value;
				} else if (returnValue instanceof YieldValue) {
					yield returnValue.value;
				} else if (returnValue instanceof YieldDelegateValue) {
					yield* returnValue.value;
				}
			}
			self.clearFunctionScope(stack, innerScopes);
		};
	}
	private getAsyncGeneratorFunction(stack: Stack) {
		const self = this;
		return async function* (this: any, ...args: any[]) {
			const innerScopes = self.initFunctionScope(stack);
			stack.declareVariable('this', this);
			self.setParameter(stack, args);
			let returnValue: any;
			const statements = (self.body as BlockStatement).getBody();
			for (const statement of statements) {
				statement.shareVariables(innerScopes);
				returnValue = statement.get(stack);
				if (stack.awaitPromise?.length > 0) {
					for (const awaitRef of stack.awaitPromise) {
						const awaitValue = await awaitRef.promise;
						if (awaitRef.declareVariable) {
							awaitRef.node.declareVariable(stack, awaitValue);
						} else {
							awaitRef.node.set(stack, awaitValue);
						}
					}
					stack.awaitPromise.splice(0);
				}
				else if (stack.forAwaitAsyncIterable) {
					for await (let iterator of stack.forAwaitAsyncIterable.iterable) {
						const result = stack.forAwaitAsyncIterable.forAwaitBody(iterator);
						if (result instanceof TerminateReturnType) {
							if (result.type === 'continue') {
								continue;
							} else {
								break;
							}
						}
						else if (result instanceof ReturnValue) {
							self.clearFunctionScope(stack, innerScopes);
							returnValue = returnValue.value;
							if (returnValue instanceof AwaitPromise) {
								return await returnValue.promise;
							} else if (returnValue instanceof YieldValue) {
								yield returnValue.value;
							} else if (returnValue instanceof YieldDelegateValue) {
								yield* returnValue.value;
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
	}
	private getFunction(stack: Stack) {
		const self = this;
		return function (this: any, ...args: any[]) {
			const innerScopes = self.initFunctionScope(stack);
			stack.declareVariable('this', this);
			self.setParameter(stack, args);
			let returnValue: any;
			const statements = (self.body as BlockStatement).getBody();
			for (const statement of statements) {
				statement.shareVariables(innerScopes);
				returnValue = statement.get(stack);
				if (returnValue instanceof ReturnValue) {
					self.clearFunctionScope(stack, innerScopes);
					return returnValue.value;
				}
			}
			self.clearFunctionScope(stack, innerScopes);
		};
	}
	dependency(computed?: true): ExpressionNode[] {
		return this.params.flatMap(param => param.dependency());
	}
	dependencyPath(computed?: true): ExpressionEventPath[] {
		return this.params.flatMap(param => param.dependencyPath(computed));
	}
	toString(): string {
		let declare: string = 'function ';
		if (this.async && this.generator) {
			declare = 'async function* ';
		} else if (this.async) {
			declare = 'async function ';
		} else if (this.generator) {
			declare = 'function* ';
		}
		return `${declare}${this.id?.toString() || ''}${this.paramsAndBodyToString()}`;
	}
	paramsAndBodyToString() {
		return `(${this.params.map(param => param.toString()).join(', ')}) ${this.body.toString()}`;
	}
	toJson(): object {
		return {
			params: this.params.map(param => param.toJSON()),
			body: this.body.toJSON(),
			async: this.async,
			id: this.id?.toJSON(),
			generator: this.generator
		};
	}
}

@Deserializer('FunctionDeclaration')
export class FunctionDeclaration extends FunctionExpression implements DeclarationExpression {
	static fromJSON(node: FunctionDeclaration, deserializer: NodeDeserializer): FunctionDeclaration {
		return new FunctionDeclaration(
			node.params.map(deserializer),
			deserializer(node.body),
			node.async,
			node.generator,
			deserializer(node.id) as Identifier
		);
	}
	static visit(node: FunctionDeclaration, visitNode: VisitNodeType): void {
		visitNode(node.id);
		node.params.forEach(visitNode);
		visitNode(node.body);
	}
	declare protected id: Identifier;
	constructor(
		params: ExpressionNode[],
		body: ExpressionNode,
		async: boolean,
		generator: boolean,
		id: Identifier) {
		super(params, body, async, generator, id);
	}
	override get(stack: Stack): Function {
		const func = super.get(stack);
		this.declareVariable(stack, func);
		return func;
	}
	declareVariable(stack: Stack, value: Function) {
		this.id.declareVariable(stack, value);
	}
}


@Deserializer('ArrowFunctionExpression')
export class ArrowFunctionExpression extends BaseFunctionExpression {
	static fromJSON(node: ArrowFunctionExpression, deserializer: NodeDeserializer): ArrowFunctionExpression {
		return new ArrowFunctionExpression(
			node.params.map(deserializer),
			Array.isArray(node.body)
				? node.body.map(deserializer)
				: deserializer(node.body),
			node.expression,
			node.async
		);
	}
	static visit(node: ArrowFunctionExpression, visitNode: VisitNodeType): void {
		node.params.forEach(visitNode);
		Array.isArray(node.body)
			? node.body.forEach(visitNode)
			: visitNode(node.body);
	}
	private generator = false;
	constructor(
		private params: ExpressionNode[],
		private body: ExpressionNode | ExpressionNode[],
		private expression: boolean,
		private async: boolean,) {
		super();
	}
	getParams() {
		return this.params;
	}
	getBody() {
		return this.body;
	}
	getExpression() {
		return this.expression;
	}
	set(stack: Stack, value: Function) {
		throw new Error('ArrowFunctionExpression#set() has no implementation.');
	}
	private setParameter(stack: Stack, args: any[]) {
		const rest = this.params[this.params.length - 1] instanceof RestElement;
		const limit = rest ? this.params.length - 1 : this.params.length;
		for (let i = 0; i < limit; i++) {
			this.params[i].set(stack, args[i]);
		}
		if (rest) {
			this.params[limit].set(stack, args.slice(limit));
		}
	}
	get(stack: Stack) {
		return this.async ? this.getAsyncArrowFunction(stack) : this.getArrowFunction(stack);
	}
	private getAsyncArrowFunction(stack: Stack) {
		async (...args: any[]) => {
			const innerScopes = this.initFunctionScope(stack);
			this.setParameter(stack, args);
			let returnValue: any;
			const statements = Array.isArray(this.body) ? this.body : [this.body];
			for (const state of statements) {
				state.shareVariables(innerScopes);
				returnValue = state.get(stack);
				if (stack.awaitPromise?.length > 0) {
					for (const awaitRef of stack.awaitPromise) {
						const awaitValue = await awaitRef.promise;
						if (awaitRef.declareVariable) {
							awaitRef.node.declareVariable(stack, awaitValue);
						} else {
							awaitRef.node.set(stack, awaitValue);
						}
					}
					stack.awaitPromise.splice(0);
				}
				else if (stack.forAwaitAsyncIterable) {
					for await (let iterator of stack.forAwaitAsyncIterable.iterable) {
						const result = stack.forAwaitAsyncIterable.forAwaitBody(iterator);
						if (result instanceof TerminateReturnType) {
							if (result.type === 'continue') {
								continue;
							} else {
								break;
							}
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
			if (this.expression) {
				return returnValue;
			}
		};
	}
	private getArrowFunction(stack: Stack) {
		return (...args: any[]) => {
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
			if (this.expression) {
				return returnValue;
			}
		};
	}
	dependency(computed?: true): ExpressionNode[] {
		return this.params.flatMap(param => param.dependency());
	}
	dependencyPath(computed?: true): ExpressionEventPath[] {
		return this.params.flatMap(param => param.dependencyPath(computed));
	}
	toString(): string {
		let str = this.async ? 'async ' : '';
		if (this.params.length === 1) {
			str += this.params[0].toString();
		} else {
			str += `(${this.params.map(param => param.toString()).join(', ')})`;
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
			async: this.async,
			generator: this.generator
		};
	}
}
