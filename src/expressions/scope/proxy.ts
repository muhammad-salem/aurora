import type { Scope, Context } from './scope.js';

// export class FunctionProxyHandler<T extends Function> implements ProxyHandler<T> {
// 	constructor(private thisContext: object) { }
// 	apply(targetFunc: T, targetThisArg: any, argArray: any[]): any {
// 		return targetFunc.apply(this.computeThisArg(targetThisArg), argArray);
// 	}

// 	private computeThisArg(targetThisArg: any): any {
// 		switch (true) {
// 			// exclude classes that have binding hook
// 			case this.thisContext instanceof Map:
// 			case this.thisContext instanceof Set:
// 			case this.thisContext instanceof Date:
// 			case this.thisContext instanceof WeakMap:
// 			case this.thisContext instanceof WeakSet:
// 			case this.thisContext instanceof Promise:
// 			case this.thisContext instanceof HTMLElement:
// 				return this.thisContext;
// 			default:
// 				return targetThisArg;
// 		}
// 	}
// }

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

		// const value = this.scope.get(propertyKey);
		// if (value == null) {
		// 	return value;
		// }
		// if (typeof value === 'object') {
		// 	const scope = this.scope.getScope(propertyKey);
		// 	if (scope) {
		// 		return new Proxy(value, new ScopeProxyHandler(scope));
		// 	}
		// } else if (typeof value === 'function') {
		// 	return new Proxy(value, this.functionHandler
		// 		?? (this.functionHandler = new FunctionProxyHandler(this.scope.getContext()))
		// 	);
		// }
		// return value;
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
