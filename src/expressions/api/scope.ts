import type { CanDeclareVariable, ExpressionNode } from './expression.js';

export type ScopeType = 'block' | 'function';
export interface Scope<T> {
	type: ScopeType;

	/**
	 * get value of `propertyKey` in current context
	 * @param propertyKey 
	 */
	get(propertyKey: PropertyKey): any;

	/**
	 * set the value of `propertyKey` in current context, could be instilled with `value`.
	 * @param propertyKey 
	 * @param value 
	 * @param receiver 
	 */
	set(propertyKey: PropertyKey, value?: any, receiver?: any): boolean;

	/**
	 * is current context has `propertyKey` in hash map keys
	 * @param propertyKey 
	 */
	has(propertyKey: PropertyKey): boolean;

	/**
	 * get current context object of this scope
	 */
	getContext(): T | undefined;

	/**
	 * get value of `propertyKey` in current context
	 * @param propertyKey 
	 */
	getScope<V extends object>(propertyKey: PropertyKey): Scope<V>;
}

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
}
