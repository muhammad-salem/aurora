import type { ScopedContext, ScopedStack } from '../scope.js';

export class DefaultScopedContext<T extends object> implements ScopedContext {
	static for<T extends object>(context: T) {
		return new DefaultScopedContext(context);
	}
	constructor(protected context: T & { [key: string]: any } & { [key: number]: any }) { }
	get(propertyKey: PropertyKey): any {
		const value = this.context[propertyKey as string];
		if (typeof value === 'function') {
			return (<Function>value).bind(this.context);
		}
		return value;
	}
	set(propertyKey: PropertyKey, value: any, receiver?: any): boolean {
		return Reflect.set(this.context, propertyKey, value);
	}
	has(propertyKey: PropertyKey): boolean {
		return propertyKey in this.context;
	}
	getProviderBy(): T | undefined {
		return this.context;
	}
}

export class ReadOnlyScopedContext<T extends object> extends DefaultScopedContext<T> {
	set(propertyKey: PropertyKey, value: any, receiver?: any): boolean {
		// do nothing
		return false;
	}
}

export class EmptyScopedContext extends DefaultScopedContext<any> {
	constructor() {
		super(Object.create(null));
	}
}

export abstract class AbstractScopedStack implements ScopedStack {
	abstract readonly localScop: ScopedContext;
	abstract readonly stack: Array<ScopedContext>;

	newStack(): ScopedStack {
		return new (this.constructor as (new ([]) => ScopedStack))(this.stack.slice());
	}
	stackFor(obj: any): ScopedStack {
		const stack = this.newStack();
		stack.addProvider(obj);
		return stack;
	}
	emptyScopeFor(obj: any | any[]): ScopedStack {
		return new EmptyScopeProvider(obj);
	}
	add(...contexts: ScopedContext[]): number {
		return this.stack.unshift(...contexts);
	}
	remove(index: number = 0): ScopedContext {
		const context = this.stack[index];
		this.stack.splice(index, 1);
		return context;
	}
	addProvider<T extends object>(obj: T): number {
		return this.add(new DefaultScopedContext(obj));
	}
	addEmptyProvider(): ScopedContext {
		const scope = new EmptyScopedContext();
		this.add(scope);
		return scope;
	}
	addReadOnlyProvider<T extends object>(provider: T): ScopedContext {
		const scope = new ReadOnlyScopedContext<T>(provider);
		this.add(scope);
		return scope;
	}
	findContext(propertyKey: PropertyKey): ScopedContext {
		if (this.localScop.has(propertyKey)) {
			return this.localScop;
		}
		return this.stack.find(context => context.has(propertyKey)) || this.localScop;
	}
	get(propertyKey: PropertyKey) {
		return this.findContext(propertyKey).get(propertyKey);
	}
	set(propertyKey: PropertyKey, value: any): boolean {
		return this.findContext(propertyKey).set(propertyKey, value);
	}
	has(propertyKey: PropertyKey): boolean {
		return this.stack.find(context => context.has(propertyKey)) ? true : false;
	}
	getProviderBy(propertyKey: PropertyKey): object | undefined {
		return this.stack.find(context => context.has(propertyKey))?.getProviderBy(propertyKey);
	}
}

export class EmptyScopeProvider extends AbstractScopedStack {
	readonly stack: Array<ScopedContext> = [];
	constructor(public readonly localScop: ScopedContext) {
		super();
	}
}

export class ScopeProvider extends AbstractScopedStack {
	static for(context: any | Array<any>) {
		return new ScopeProvider([DefaultScopedContext.for(context)]);
	}
	readonly localScop: ScopedContext = new EmptyScopedContext();
	readonly stack: Array<ScopedContext>;
	constructor(stack: Array<ScopedContext>) {
		super();
		this.stack = stack;
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
