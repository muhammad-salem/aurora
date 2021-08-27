import { Scope as ScopeInterface, ScopeType } from '../scope.js';

export class Scope<T extends object> implements ScopeInterface<T> {
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
	private scopeMap = new Map<PropertyKey, ScopeInterface<any>>();
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
	getScope<V extends object>(propertyKey: PropertyKey): ScopeInterface<V> {
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
