import type { AsyncIterableInfo, AwaitPromiseInfo, ContextProvider, StackProvider } from '../scope';

export class DefaultContextProvider<T extends object> implements ContextProvider {
	static for<T extends object>(context: T) {
		return new DefaultContextProvider(context);
	}
	constructor(protected context: T) { }
	get(propertyKey: PropertyKey): any {
		return Reflect.get(this.context, propertyKey);
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

export class ReadOnlyContextProvider<T extends object> extends DefaultContextProvider<T> {
	set(propertyKey: PropertyKey, value: any, receiver?: any): boolean {
		// do nothing
		return false;
	}
}

export class EmptyContextProvider extends DefaultContextProvider<any> {
	constructor() {
		super(Object.create(null));
	}
}

export abstract class AbstractScopedStack implements StackProvider {
	abstract readonly localScop: ContextProvider;
	abstract readonly stack: Array<ContextProvider>;

	awaitPromise: Array<AwaitPromiseInfo> = [];

	forAwaitAsyncIterable?: AsyncIterableInfo;

	newStack(): StackProvider {
		const stack = new (this.constructor as (new ([]) => StackProvider))(this.stack.slice());
		stack.add(this.localScop);
		return stack;
	}
	stackFor(obj: any): StackProvider {
		const stack = this.newStack();
		stack.addProvider(obj);
		return stack;
	}
	emptyStackProviderWith(obj: any | any[]): StackProvider {
		return new EmptyScopeProvider(DefaultContextProvider.for(obj));
	}
	add(...contexts: ContextProvider[]): number {
		return this.stack.unshift(...contexts);
	}
	remove(index: number = 0): ContextProvider {
		const context = this.stack[index];
		this.stack.splice(index, 1);
		return context;
	}
	addProvider<T extends object>(obj: T): number {
		return this.add(new DefaultContextProvider(obj));
	}
	addEmptyProvider(): ContextProvider {
		const scope = new EmptyContextProvider();
		this.add(scope);
		return scope;
	}
	addReadOnlyProvider<T extends object>(provider: T): ContextProvider {
		const scope = new ReadOnlyContextProvider<T>(provider);
		this.add(scope);
		return scope;
	}
	findContext(propertyKey: PropertyKey): ContextProvider {
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

	resolveAwait(value: AwaitPromiseInfo): void {
		this.awaitPromise.push(value);
	}
}

export class EmptyScopeProvider extends AbstractScopedStack {
	readonly stack: Array<ContextProvider> = [];
	constructor(public readonly localScop: ContextProvider) {
		super();
	}
}

export class ScopeProvider extends AbstractScopedStack {
	static for(context: any | Array<any>) {
		return new ScopeProvider([DefaultContextProvider.for(context)]);
	}
	readonly localScop: ContextProvider = new EmptyContextProvider();
	readonly stack: Array<ContextProvider>;
	constructor(stack: Array<ContextProvider>) {
		super();
		this.stack = stack;
	}
}

/////////////// proxy handler as scoped context /////////////////////

/**
 * crete new proxy handler object as scoped context
 */
export class ScopeProxyHandler implements ProxyHandler<ContextProvider> {
	has(target: ContextProvider, propertyKey: PropertyKey): boolean {
		return target.has(propertyKey);
	}
	get(target: ContextProvider, propertyKey: PropertyKey, receiver: any): any {
		return target.get(propertyKey);
	}
	set(target: ContextProvider, propertyKey: PropertyKey, value: any, receiver: any): boolean {
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

export function revocableProxyOfScopedContext<T extends ContextProvider>(context: T): RevocableProxy<T> {
	return Proxy.revocable<T>(context, DefaultScopeProxyHandler);
}
