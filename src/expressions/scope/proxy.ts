import type { Scope } from './scope.js';

/**
 * crete new proxy handler object as scoped context
 */
export class ScopeProxyHandler<T extends object> implements ProxyHandler<T> {
	private proxyMap = new Map<PropertyKey, T>();
	constructor(private scope: Scope<T>) { }
	has(model: T, propertyKey: PropertyKey): boolean {
		return this.scope.has(propertyKey);
	}
	get(model: T, propertyKey: PropertyKey, receiver: any): any {
		if (this.proxyMap.has(propertyKey)) {
			return this.proxyMap.get(propertyKey);
		}
		const value = this.scope.get(propertyKey);
		if (typeof value === 'object') {
			const scope = this.scope.getScope(propertyKey);
			if (scope) {
				const proxy = new Proxy(value, new ScopeProxyHandler(scope));
				this.proxyMap.set(propertyKey, proxy);
				return proxy;
			}
		}
		return value;
	}
	set(model: T, propertyKey: PropertyKey, value: any, receiver: any): boolean {
		return this.scope.set(propertyKey, value);
	}
	deleteProperty(model: T, propertyKey: string | symbol): boolean {
		const isDelete = Reflect.deleteProperty(model, propertyKey);
		if (isDelete) {
			this.scope.set(propertyKey, undefined);
			if (this.proxyMap.has(propertyKey)) {
				this.proxyMap.delete(propertyKey);
			}
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
