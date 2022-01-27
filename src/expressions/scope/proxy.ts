import type { Scope, ScopeContext } from './scope.js';

export class FunctionProxyHandler<T extends Function> implements ProxyHandler<T> {
	constructor(private thisContext: object) { }
	apply(targetFunc: T, targetThisArg: any, argArray: any[]): any {
		return targetFunc.apply(this.computeThisArg(targetThisArg), argArray);
	}

	private computeThisArg(targetThisArg: any): any {
		switch (true) {
			case this.thisContext instanceof Map:
			case this.thisContext instanceof Set:
			case this.thisContext instanceof Date:
			case this.thisContext instanceof WeakMap:
			case this.thisContext instanceof WeakSet:
			case this.thisContext instanceof Promise:
				return this.thisContext;
			default:
				return targetThisArg;
		}
	}
}

/**
 * crete new proxy handler object as scoped context
 */
export class ScopeProxyHandler<T extends ScopeContext> implements ProxyHandler<ScopeContext> {
	private proxyMap = new Map<PropertyKey, T>();
	private proxyValueMap = new WeakMap<object, object>();
	private functionHandler: FunctionProxyHandler<Function>;
	constructor(private scope: Scope<T>) { }
	has(model: T, propertyKey: PropertyKey): boolean {
		return this.scope.has(propertyKey);
	}
	get(model: T, propertyKey: PropertyKey, receiver: any): any {
		if (this.proxyMap.has(propertyKey)) {
			return this.proxyMap.get(propertyKey);
		}
		const value = this.scope.get(propertyKey);
		if (value == null) {
			return value;
		}
		if (typeof value === 'object') {
			const scope = this.scope.getScope(propertyKey);
			if (scope) {
				const proxy = new Proxy(value, new ScopeProxyHandler(scope));
				this.proxyMap.set(propertyKey, proxy);
				this.proxyValueMap.set(proxy, value);
				return proxy;
			}
		} else if (typeof value === 'function') {
			const proxy = new Proxy(value, this.functionHandler
				?? (this.functionHandler = new FunctionProxyHandler(this.scope.getContext()))
			);
			this.proxyMap.set(propertyKey, proxy);
			this.proxyValueMap.set(proxy, value);
			return proxy;
		}
		return value;
	}
	set(model: T, propertyKey: PropertyKey, value: any, receiver: any): boolean {
		if ((typeof value === 'object' || typeof value === 'function') && this.proxyValueMap.has(value)) {
			value = this.proxyValueMap.get(value);
		}
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

export function createProxyForContext<T extends object>(scope: Scope<T>): T {
	return new Proxy<T>(scope.getContext(), new ScopeProxyHandler(scope));
}
