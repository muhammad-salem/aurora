import { createProxyForContext, ReactiveScopeControl } from '@ibyar/expressions';
import { TypeOf } from '@ibyar/expressions/api/utils';

export class ElementModelReactiveScope<T extends { [key: PropertyKey]: any }> extends ReactiveScopeControl<T> {
	static for<T extends object>(context: T, propertyKeys?: (keyof T)[]) {
		return new ElementModelReactiveScope(context, propertyKeys);
	}
	private contextProxy = createProxyForContext(this);
	getContextProxy(): T {
		return this.contextProxy;
	}
	getClass(): TypeOf<ElementModelReactiveScope<T>> {
		return ElementModelReactiveScope;
	}
}
