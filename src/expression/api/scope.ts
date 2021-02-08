export interface ScopedContext {

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
}

export interface ScopedStack extends Array<ScopedContext>, ScopedContext {
    readonly localScop: ScopedContext;
    /**
     * add one or many context scopes on the top of the current stack
     * @param contexts 
     */
    add(...contexts: ScopedContext[]): number;
    /**
     * remove the scope context with the `index` from this stack 
     * @param index the index to remove from this stack `array`
     * @returns the context scope that removed
     */
    remove(index: number): ScopedContext;
    /**
     * add an `object` as a context provider on the top of this stack.
     * @param obj 
     * @returns the index of new object in this stack
     */
    addProvider(obj: any): number;

    /**
     * add an empty provider to this scop
     */
    addEmptyProvider(): ScopedContext;
    /**
     * search for the first context that have property key
     * if not found will return the stack local scop as a default value
     * @param propertyKey the property key
     */
    findContext(propertyKey: PropertyKey): ScopedContext;

    /**
     * crete chained stack based on this stack.
     */
    newStack(): ScopedStack;

    /**
     * 
     * @param obj create chained stack for provided object
     */
    stackFor(obj: any): ScopedStack;

    /**
     * 
     * @param obj create an empty stack for this provided object, as local scope context
     */
    emptyScopeFor(obj: any): ScopedStack;
}
