
export type ScopeType = 'block' | 'function';
export interface Scope<T> {
	type: ScopeType;

	/**
	 * get value of `propertyKey` in current context
	 * @param propertyKey 
	 */
	get(propertyKey: PropertyKey): any;

	/**
	 * set the value of `propertyKey` in current context, could be instilled with `value`.
	 * @param propertyKey 
	 * @param value 
	 * @param receiver 
	 */
	set(propertyKey: PropertyKey, value?: any, receiver?: any): boolean;

	/**
	 * is current context has `propertyKey` in hash map keys
	 * @param propertyKey 
	 */
	has(propertyKey: PropertyKey): boolean;

	/**
	 * get current context object of this scope
	 */
	getContext(): T | undefined;

	/**
	 * get value of `propertyKey` in current context
	 * @param propertyKey 
	 */
	getScope<V extends object>(propertyKey: PropertyKey): Scope<V>;
}

export class Scope<T extends object> implements Scope<T> {
	static for<T extends object>(context: T, type: ScopeType) {
		return new Scope(context, type);
	}
	static blockScopeFor<T extends object>(context: T) {
		return new Scope(context, 'block');
	}
	static functionScopeFor<T extends object>(context: T) {
		return new Scope(context, 'function');
	}
	static emptyBlockScope<T extends object>() {
		return new Scope({} as T, 'block');
	}
	static emptyFunctionScope<T extends object>() {
		return new Scope({} as T, 'function');
	}
	private scopeMap = new Map<PropertyKey, Scope<any>>();
	constructor(protected context: T, public type: ScopeType) { }
	get(propertyKey: PropertyKey): any {
		return Reflect.get(this.context, propertyKey);
	}
	set(propertyKey: PropertyKey, value: any, receiver?: any): boolean {
		return Reflect.set(this.context, propertyKey, value);
	}
	has(propertyKey: PropertyKey): boolean {
		return propertyKey in this.context;
	}
	getContext(): T | undefined {
		return this.context;
	}
	getScope<V extends object>(propertyKey: PropertyKey): Scope<V> {
		let scope = this.scopeMap.get(propertyKey);
		if (scope) {
			return scope;
		}
		const scopeContext = this.get(propertyKey);
		scope = new Scope(scopeContext, 'block');
		this.scopeMap.set(propertyKey, scope);
		return scope;
	}
}

export class ReadOnlyScope<T extends object> extends Scope<T> {
	set(propertyKey: PropertyKey, value: any, receiver?: any): boolean {
		// do nothing
		return false;
	}
}
