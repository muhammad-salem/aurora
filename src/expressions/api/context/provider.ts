import type { ScopedContext, ScopedStack } from '../scope.js';

export class DefaultScopedContext implements ScopedContext {
	static for(context: any | Array<any>) {
		return new DefaultScopedContext(context);
	}
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

export abstract class AbstractScopedStack extends Array<ScopedContext> implements ScopedStack {

	abstract readonly localScop: ScopedContext;

	constructor(...args: ScopedContext[]) {
		super(...args);
	}

	newStack(): ScopedStack {
		return new ScopeProvider(this);
	}
	stackFor(obj: any): ScopedStack {
		const newStack = this.newStack();
		newStack.addProvider(obj);
		return newStack;
	}
	emptyScopeFor(obj: any | any[]): ScopedStack {
		return new EmptyScopeProvider(obj);
	}
	add(...contexts: ScopedContext[]): number {
		return this.unshift(...contexts);
	}
	remove(index: number = 0): ScopedContext {
		const context = this[index];
		this.splice(index, 1);
		return context;
	}
	addProvider(obj: any | any[]): number {
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
	get(propertyKey: PropertyKey) {
		return this.findContext(propertyKey).get(propertyKey);
	}
	set(propertyKey: PropertyKey, value: any): boolean {
		return this.findContext(propertyKey).set(propertyKey, value);
	}
	has(propertyKey: PropertyKey): boolean {
		return this.find(context => context.has(propertyKey)) ? true : false;
	}

}

export class EmptyScopeProvider extends AbstractScopedStack {

	constructor(public readonly localScop: ScopedContext) {
		super();
	}

}

export class ScopeProvider extends AbstractScopedStack {
	static for(context: any | Array<any>) {
		return new ScopeProvider(DefaultScopedContext.for(context));
	}
	readonly localScop: ScopedContext = new EmptyScopedContext();
	constructor(first: ScopedContext) {
		super(first);
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
