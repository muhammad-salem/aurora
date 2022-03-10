import { createProxyForContext, ReactiveScopeControl, ScopeType } from '@ibyar/expressions';

export class ElementModelReactiveScope<T extends { [key: PropertyKey]: any }> extends ReactiveScopeControl<T> {
	static for<T extends object>(context: T, type: ScopeType, propertyKeys?: (keyof T)[]) {
		return new ElementModelReactiveScope(context, type, propertyKeys);
	}
	static blockScopeFor<T extends object>(context: T, propertyKeys?: (keyof T)[]) {
		return new ElementModelReactiveScope(context, 'block', propertyKeys);
	}
	static functionScopeFor<T extends object>(context: T, propertyKeys?: (keyof T)[]) {
		return new ElementModelReactiveScope(context, 'function', propertyKeys);
	}
	static classScopeFor<T extends object>(context: T, propertyKeys?: (keyof T)[]) {
		return new ElementModelReactiveScope(context, 'class', propertyKeys);
	}
	static moduleScopeFor<T extends object>(context: T, propertyKeys?: (keyof T)[]) {
		return new ElementModelReactiveScope(context, 'module', propertyKeys);
	}
	static globalScopeFor<T extends object>(context: T, propertyKeys?: (keyof T)[]) {
		return new ElementModelReactiveScope(context, 'global', propertyKeys);
	}
	private contextProxy = createProxyForContext(this);
	getContextProxy(): T {
		return this.contextProxy;
	}
}
