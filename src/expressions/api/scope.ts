import type { CanDeclareVariable, ExpressionNode } from './expression.js';

export type ScopeType = 'block' | 'function';
export interface Scope<T> {
	type: ScopeType;

	/**
	 * get the first context provider that have `propertyKey`
	 * @param propertyKey 
	 */
	get(propertyKey: PropertyKey): any;

	/**
	 * set the value of `propertyKey` in its context provider with `value`.
	 * @param propertyKey 
	 * @param value 
	 * @param receiver 
	 */
	set(propertyKey: PropertyKey, value: any, receiver?: any): boolean;

	/**
	 * search for a scope context that have propertyKey
	 * @param propertyKey 
	 */
	has(propertyKey: PropertyKey): boolean;

	/**
	 * get context object for this scope
	 */
	getScopeContext(): T | undefined;
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
	findScope<T = any>(propertyKey: PropertyKey): Scope<T>;

	// /**
	//  * add one or many context scopes on the top of the current stack
	//  * @param contexts 
	//  * @returns the stack length
	//  */
	// add(...contexts: Scope[]): number;

	// /**
	//  * remove the scope context with the `index` from this stack 
	//  * @param index the index to remove from this stack `array`
	//  * @returns the context scope that removed
	//  */
	// remove(index: number): Scope;

	/**
	//  * add an `object` as a context provider on the top of this stack.
	//  * @param obj 
	//  * @returns the index of new object in this stack
	//  */
	// addProvider<T extends object>(obj: T): number;

	// /**
	//  * add an empty provider to this scop
	//  */
	// addEmptyProvider(): Scope;

	// /**
	//  * add an readonly provider to this scop, you cant set any value in this provider
	//  */
	// addReadOnlyProvider<T extends object>(provider: T): Scope;

	/**
	 * search for the first context that have property key
	 * if not found will return the stack local scop as a default value
	 * @param propertyKey the property key
	 */
	// findContext(propertyKey: PropertyKey): Scope;

	/**
	 * 
	 * @param obj create an empty stack for this provided object, as local scope context
	 */
	// emptyStackProviderWith(obj: any | any[]): StackProvider;

	resolveAwait(value: AwaitPromiseInfo): void;
	popScope<T = any>(): Scope<T>;
	removeScope<T = any>(scope: Scope<T>): void;

	pushScope<T extends object>(scope: Scope<T>): void;

	pushBlockScope<T extends object>(): Scope<T>;
	pushFunctionScope<T extends object>(): Scope<T>;

	pushBlockScopeFor<T extends object>(context: T): Scope<T>;
	pushFunctionScopeFor<T extends object>(context: T): Scope<T>;

	// /**
	//  * create chained stack based on this stack.
	//  */
	// newStack(): Stack;

	// /**
	//  * 
	//  * @param obj create chained stack for provided object
	//  */
	// stackFor(obj: any): Stack;
}
