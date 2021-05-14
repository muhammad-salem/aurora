export interface ContextProvider {

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
	 * get context object of this provider
	 * search for the first context object that has `propertyKey`
	 * @param propertyKey 
	 */
	getProviderBy(propertyKey: PropertyKey): object | undefined;
}

export interface AwaitPromiseInfo {
	promise: Promise<any>;
	node: { set(stack: StackProvider, value: any): any; };
}

export interface AsyncIterableInfo {
	iterable: AsyncIterable<any>
	forAwaitBody: (iterator: any) => any;
}

export interface StackProvider extends ContextProvider {
	readonly localScop: ContextProvider;
	awaitPromise: Array<AwaitPromiseInfo>;
	forAwaitAsyncIterable?: AsyncIterableInfo;
	/**
	 * add one or many context scopes on the top of the current stack
	 * @param contexts 
	 */
	add(...contexts: ContextProvider[]): number;
	/**
	 * remove the scope context with the `index` from this stack 
	 * @param index the index to remove from this stack `array`
	 * @returns the context scope that removed
	 */
	remove(index: number): ContextProvider;
	/**
	 * add an `object` as a context provider on the top of this stack.
	 * @param obj 
	 * @returns the index of new object in this stack
	 */
	addProvider<T extends object>(obj: T): number;

	/**
	 * add an empty provider to this scop
	 */
	addEmptyProvider(): ContextProvider;

	/**
	 * add an readonly provider to this scop, you cant set any value in this provider
	 */
	addReadOnlyProvider<T extends object>(provider: T): ContextProvider;
	/**
	 * search for the first context that have property key
	 * if not found will return the stack local scop as a default value
	 * @param propertyKey the property key
	 */
	findContext(propertyKey: PropertyKey): ContextProvider;

	/**
	 * crete chained stack based on this stack.
	 */
	newStack(): StackProvider;

	/**
	 * 
	 * @param obj create chained stack for provided object
	 */
	stackFor(obj: any): StackProvider;

	/**
	 * 
	 * @param obj create an empty stack for this provided object, as local scope context
	 */
	emptyScopeFor(obj: any | any[]): StackProvider;

	resolveAwait(value: AwaitPromiseInfo): void;
}
