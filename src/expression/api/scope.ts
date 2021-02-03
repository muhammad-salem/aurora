export interface ScopedContext {
    get(propertyKey: PropertyKey): any;
    set(propertyKey: PropertyKey, value: any, receiver?: any): boolean;
    has(propertyKey: PropertyKey): boolean;
}

export interface ScopedStack extends Array<ScopedContext>, ScopedContext {
    readonly localScop: ScopedContext;
    add(...contexts: ScopedContext[]): number;
    remove(index: number): ScopedContext;
    addProvider(obj: any): number;
    addEmptyProvider(): ScopedContext;
    findContext(propertyKey: PropertyKey): ScopedContext;
    newStack(): ScopedStack;
}
