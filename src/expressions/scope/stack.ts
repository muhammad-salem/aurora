import type { CanDeclareVariable, ExpressionNode } from '../api/expression.js';
import { Scope, ScopeType } from './scope.js';


export type AwaitPromiseInfoNode = ExpressionNode & CanDeclareVariable;
export interface AwaitPromiseInfo {
	promise: Promise<any>;
	node: AwaitPromiseInfoNode;

	declareVariable: boolean;
	scopeType: ScopeType;
}

export interface AsyncIterableInfo {
	iterable: AsyncIterable<any>;
	forAwaitBody: (iterator: any) => any;
}

export interface Stack {
	/**
	 * a list of promises to resolve in an 'async' scope as 'async function'
	 */
	awaitPromise: Array<AwaitPromiseInfo>;

	/**
	 * resolve await promise in 'await for in' scope
	 */
	forAwaitAsyncIterable?: AsyncIterableInfo;

	/**
	 * is this stack has a propertyKey
	 * @param propertyKey 
	 */
	has(propertyKey: PropertyKey): boolean;

	/**
	 * get the first value for provided property key,
	 * 
	 * will search current stack in all scope till find the first key, else undefined
	 * @param propertyKey 
	 */
	get(propertyKey: PropertyKey): any;

	/**
	 * set the value of `propertyKey` in its context provider with `value`.
	 * else define it in the first scope 'local scope'
	 * @param propertyKey 
	 * @param value 
	 * @param receiver 
	 */
	set(propertyKey: PropertyKey, value: any, receiver?: any): boolean;

	/**
	 * declare variable in stack by scope type,
	 * 
	 * 'block' for the first scop ==> may be 'block' or 'function' scope
	 * 
	 * 'function' will search for the first scope with scope type 'function'
	 *  then define a property key with 'initial' value in thus scope
	 * @param scopeType  "function" | "block"
	 * @param propertyKey the name of property mey be string | number | symbol, 
	 * @param propertyValue if not exist will be initialize with 'undefined' value
	 */
	declareVariable(scopeType: ScopeType, propertyKey: PropertyKey, propertyValue?: any): any;


	/**
	 * get context object of this provider,
	 * search for the first context object that has `propertyKey`.
	 * 
	 * search for the first context that have property key,
	 * if not found will return the stack local scop as a default value
	 * @param propertyKey the property key
	 */
	findScope<T extends object>(propertyKey: PropertyKey): Scope<T>;

	resolveAwait(value: AwaitPromiseInfo): void;

	/**
	 * get a reference to the last scope in this stack
	 */
	lastScope<T extends object>(): Scope<T>;

	/**
	 * clear every thing after this scope, and even this scope
	 * @param scope 
	 */
	clearTo<T extends object>(scope: Scope<T>): boolean;

	/**
	 * clear every thing after this scope, but not this scope
	 * @param scope 
	 */
	clearTill<T extends object>(scope: Scope<T>): boolean;

	popScope<T extends object>(): Scope<T>;

	removeScope<T extends object>(scope: Scope<T>): void;

	pushScope<T extends object>(scope: Scope<T>): void;

	pushBlockScope<T extends object>(): Scope<T>;

	pushFunctionScope<T extends object>(): Scope<T>;

	pushBlockScopeFor<T extends object>(context: T): Scope<T>;

	pushFunctionScopeFor<T extends object>(context: T): Scope<T>;

	copyStack(): Stack;
}

export class Stack implements Stack {
	awaitPromise: AwaitPromiseInfo[];
	forAwaitAsyncIterable?: AsyncIterableInfo | undefined;

	protected readonly stack: Array<Scope<any>>;

	constructor(stack?: Array<Scope<any>>) {
		this.stack = stack ?? [];
	}

	has(propertyKey: PropertyKey): boolean {
		return this.stack.find(context => context.has(propertyKey)) ? true : false;
	}
	get(propertyKey: PropertyKey) {
		return this.findScope(propertyKey).get(propertyKey);
	}
	set(propertyKey: PropertyKey, value: any, receiver?: any): boolean {
		return this.findScope(propertyKey).set(propertyKey, value, receiver);
	}
	declareVariable(scopeType: ScopeType, propertyKey: PropertyKey, propertyValue?: any) {
		if (scopeType === 'block') {
			return this.stack[0].set(propertyKey, propertyValue);
		}
		for (const scope of this.stack) {
			if (scope.type === scopeType) {
				scope.set(propertyKey, propertyValue);
				break;
			}
		}
	}
	findScope<T extends object>(propertyKey: PropertyKey): Scope<T> {
		let lastIndex = this.stack.length;
		while (lastIndex--) {
			const scope = this.stack[lastIndex];
			if (scope.has(propertyKey)) {
				return scope;
			}
		}
		return this.stack[0];
	}
	resolveAwait(value: AwaitPromiseInfo): void {
		this.awaitPromise.push(value);
	}
	popScope<T extends object>(): Scope<T> {
		return this.stack.pop()!;
	}
	removeScope<T extends object>(scope: Scope<T>): void {
		const index = this.stack.lastIndexOf(scope);
		this.stack.splice(index, 1);
	}
	pushScope<T extends object>(scope: Scope<T>): void {
		this.stack.push(scope);
	}
	pushBlockScope<T extends object>(): Scope<T> {
		const scope = Scope.emptyBlockScope<T>();
		this.stack.push(scope);
		return scope;
	}
	pushFunctionScope<T extends object>(): Scope<T> {
		const scope = Scope.emptyFunctionScope<T>();
		this.stack.push(scope);
		return scope;
	}
	pushBlockScopeFor<T extends object>(context: T): Scope<T> {
		const scope = Scope.blockScopeFor(context);
		this.stack.push(scope);
		return scope;
	}
	pushFunctionScopeFor<T extends object>(context: T): Scope<T> {
		const scope = Scope.functionScopeFor(context);
		this.stack.push(scope);
		return scope;
	}
	lastScope<T extends object>(): Scope<T> {
		return this.stack[this.stack.length - 1];
	}
	clearTo<T extends object>(scope: Scope<T>): boolean {
		const index = this.stack.lastIndexOf(scope);
		if (index === -1) {
			return false;
		}
		this.stack.splice(index);
		return true;
	}
	clearTill<T extends object>(scope: Scope<T>): boolean {
		const index = this.stack.lastIndexOf(scope);
		if (index === -1) {
			return false;
		}
		this.stack.splice(index + 1);
		return true;
	}

	copyStack(): Stack {
		return new Stack(this.stack.slice());
	}
}
