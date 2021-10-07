import type { Scope } from './scope.js';

/**
 * crete new proxy handler object as scoped context
 */
export class ScopeProxyHandler<T extends object> implements ProxyHandler<T> {
	constructor(private scope: Scope<T>) { }
	has(model: T, propertyKey: PropertyKey): boolean {
		return this.scope.has(propertyKey);
	}
	get(model: T, propertyKey: PropertyKey, receiver: any): any {
		return this.scope.get(propertyKey);
	}
	set(model: T, propertyKey: PropertyKey, value: any, receiver: any): boolean {
		return this.scope.set(propertyKey, value);
	}
	deleteProperty(model: T, propertyKey: string | symbol): boolean {
		const isDelete = Reflect.deleteProperty(model, propertyKey);
		if (isDelete) {
			this.scope.set(propertyKey, undefined);
		}
		return isDelete;
	}
}

export type RevocableProxy<T> = {
	proxy: T;
	revoke: () => void;
};

export function createRevocableProxyForContext<T extends object>(context: T, scope: Scope<T>): RevocableProxy<T> {
	return Proxy.revocable<T>(context, new ScopeProxyHandler(scope));
}

export function createProxyForContext<T extends object>(context: T, scope: Scope<T>): T {
	return new Proxy<T>(context, new ScopeProxyHandler(scope));
}
