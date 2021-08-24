import { Scope } from '../scope.js';

/**
 * crete new proxy handler object as scoped context
 */
export class ScopeProxyHandler implements ProxyHandler<Scope<any>> {
	has(target: Scope<any>, propertyKey: PropertyKey): boolean {
		return target.has(propertyKey);
	}
	get(target: Scope<any>, propertyKey: PropertyKey, receiver: any): any {
		return target.get(propertyKey);
	}
	set(target: Scope<any>, propertyKey: PropertyKey, value: any, receiver: any): boolean {
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

export function revocableProxyOfScopedContext<T extends Scope<any>>(context: T): RevocableProxy<T> {
	return Proxy.revocable<T>(context, DefaultScopeProxyHandler);
}
