import { createProxyForContext, FunctionProxyHandler, ReactiveScope, ScopeType } from '@ibyar/expressions';


export class ElementModelReactiveScope<T extends { [key: PropertyKey]: any }> extends ReactiveScope<T> {
	static for<T extends object>(context: T, type: ScopeType) {
		return new ElementModelReactiveScope(context, type);
	}
	static blockScopeFor<T extends object>(context: T) {
		return new ElementModelReactiveScope(context, 'block');
	}
	static functionScopeFor<T extends object>(context: T) {
		return new ElementModelReactiveScope(context, 'function');
	}
	static classScopeFor<T extends object>(context: T) {
		return new ElementModelReactiveScope(context, 'class');
	}
	static moduleScopeFor<T extends object>(context: T) {
		return new ElementModelReactiveScope(context, 'module');
	}
	static globalScopeFor<T extends object>(context: T) {
		return new ElementModelReactiveScope(context, 'global');
	}
	private functionProxyMap = new Map<PropertyKey, Function>();
	private contextProxy = createProxyForContext(this.context, this);
	getContextProxy() {
		return this.contextProxy;
	}
	get(propertyKey: PropertyKey): any {
		if (this.functionProxyMap.has(propertyKey)) {
			return this.functionProxyMap.get(propertyKey);
		}
		const value = Reflect.get(this.context, propertyKey);
		if (typeof value === 'function') {
			const proxy = new Proxy<Function>(value, new FunctionProxyHandler<Function>(this.contextProxy));
			this.functionProxyMap.set(propertyKey, proxy);
			return proxy;
		}
		return value;
	}
}
