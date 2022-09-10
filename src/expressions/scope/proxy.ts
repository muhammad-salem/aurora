import type { Scope, Context } from './scope.js';

export function hasBindingHook<T>(ctx: T) {
	switch (true) {
		// exclude classes that have binding hook
		case ctx instanceof Map:
		case ctx instanceof Set:
		case ctx instanceof Date:
		case ctx instanceof WeakMap:
		case ctx instanceof WeakSet:
		case ctx instanceof Promise:
		case HTMLElement && ctx instanceof HTMLElement:
			return true;
		default:
			return false;
	}
}

/**
 * crete new proxy handler object as scoped context
 */
export class ScopeProxyHandler<T extends Context> implements ProxyHandler<Context> {
	// private functionHandler: FunctionProxyHandler<Function>;
	constructor(private scope: Scope<T>) { }
	has(model: T, propertyKey: PropertyKey): boolean {
		return this.scope.has(propertyKey);
	}
	get(model: T, propertyKey: PropertyKey, receiver: any): any {
		const value = this.scope.get(propertyKey);
		if (!(value && typeof value === 'object')) {
			return value;
		}
		const scope = this.scope.getInnerScope(propertyKey);
		if (!scope) {
			return value;
		}
		return createProxyForContext(scope);
	}
	set(model: T, propertyKey: PropertyKey, value: any, receiver: any): boolean {
		return this.scope.set(propertyKey, value);
	}
	deleteProperty(model: T, propertyKey: string | symbol): boolean {
		return this.scope.delete(propertyKey);
	}
}

export type RevocableProxy<T> = {
	proxy: T;
	revoke: () => void;
};

export function createRevocableProxyForContext<T extends object>(context: T, scope: Scope<T>): RevocableProxy<T> {
	return Proxy.revocable<T>(context, new ScopeProxyHandler(scope));
}

export function createProxyForContext<T extends object>(scope: Scope<T>): T {
	return new Proxy<T>(scope.getContext(), new ScopeProxyHandler(scope));
}
