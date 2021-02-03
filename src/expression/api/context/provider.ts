import type { ScopedContext, ScopedStack } from '../scope.js';

export class DefaultScopedContext implements ScopedContext {
    constructor(private context: any | Array<any>) { }
    get(propertyKey: PropertyKey): any {
        return Reflect.get(this.context, propertyKey);
    }
    set(propertyKey: PropertyKey, value: any, receiver?: any): boolean {
        return Reflect.set(this.context, propertyKey, value);
    }
    has(propertyKey: PropertyKey): boolean {
        return propertyKey in this.context;
    }
}

export class EmptyScopedContext extends DefaultScopedContext {
    constructor() {
        super(Object.create(null));
    }
}

export class ScopeProvider extends Array<ScopedContext> implements ScopedStack {
    readonly localScop: ScopedContext = new EmptyScopedContext();
    constructor(first: ScopedContext) {
        super(first);
    }
    newStack(): ScopedStack {
        return new ScopeProvider(this);
    }
    add(...contexts: ScopedContext[]): number {
        return this.unshift(...contexts);
    }
    remove(index: number = 0): ScopedContext {
        const context = this[index];
        this.splice(index, 1);
        return context;
    }
    addProvider(obj: any): number {
        return this.add(new DefaultScopedContext(obj));
    }
    addEmptyProvider(): ScopedContext {
        const scope = new EmptyScopedContext();
        this.add(scope);
        return scope;
    }
    findContext(propertyKey: PropertyKey): ScopedContext {
        return this.find(context => context.has(propertyKey)) || this.localScop;
    }
    has(propertyKey: PropertyKey): boolean {
        return this.findContext(propertyKey).has(propertyKey);
    }
    get(propertyKey: PropertyKey) {
        return this.findContext(propertyKey).get(propertyKey);
    }
    set(propertyKey: PropertyKey, value: any): boolean {
        return this.findContext(propertyKey).set(propertyKey, value);
    }
}

/////////////// proxy handler as scoped context /////////////////////

/**
 * crete new proxy handler object as scoped context
 */
export class ScopeProxyHandler implements ProxyHandler<ScopedContext> {
    has(target: ScopedContext, propertyKey: PropertyKey): boolean {
        return target.has(propertyKey);
    }
    get(target: ScopedContext, propertyKey: PropertyKey, receiver: any): any {
        return target.get(propertyKey);
    }
    set(target: ScopedContext, propertyKey: PropertyKey, value: any, receiver: any): boolean {
        return target.set(propertyKey, value);
    }
}

/**
 * a default scoped proxy handler is enough
 */
const DefaultScopeProxyHandler = new ScopeProxyHandler();

export type RevocableProxy<T> = {
    proxy: T;
    revoke: () => void;
};

export function revocableProxyOfScopedContext<T extends ScopedContext>(context: T): RevocableProxy<T> {
    return Proxy.revocable<T>(context, DefaultScopeProxyHandler);
}
