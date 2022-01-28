import { createProxyForContext, ReactiveScopeControl, ScopeType } from '@ibyar/expressions';

export class ElementModelReactiveScope<T extends { [key: PropertyKey]: any }> extends ReactiveScopeControl<T> {
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
	private contextProxy = createProxyForContext(this);
	getContextProxy(): T {
		return this.contextProxy;
	}
}
