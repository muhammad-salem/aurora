import { ReactiveScope, ReactiveControlScope, ReadOnlyScope, Scope } from './scope.js';

const pool = new WeakMap<object, Scope<any>>();

export type ScopeType = 'scope' | 'read-only' | 'reactive' | 'reactive-control';

export function getScopeFor<S extends Scope<T>, T extends object>(ctx: T): S | undefined;
export function getScopeFor<T extends object>(ctx: T, type: 'scope', propertyKeys?: (keyof T)[]): Scope<T>;
export function getScopeFor<T extends object>(ctx: T, type: 'read-only', propertyKeys?: (keyof T)[]): ReadOnlyScope<T>;
export function getScopeFor<T extends object>(ctx: T, type: 'reactive', propertyKeys?: (keyof T)[]): ReactiveScope<T>;
export function getScopeFor<T extends object>(ctx: T, type: 'reactive-control', propertyKeys?: (keyof T)[]): ReactiveControlScope<T>;
export function getScopeFor<S extends Scope<T>, T extends object>(ctx: T, type?: ScopeType, propertyKeys?: (keyof T)[]): S | undefined {
	if (pool.has(ctx)) {
		return pool.get(ctx) as any;
	}
	if (!type) {
		return;
	}
	let scope: Scope<T>;
	switch (type) {
		case 'read-only':
			scope = ReadOnlyScope.for(ctx, propertyKeys);
			break;
		case 'reactive':
			scope = ReactiveScope.for(ctx, propertyKeys);
			break;
		case 'reactive-control':
			scope = ReactiveControlScope.for(ctx, propertyKeys);
			break;
		default:
		case 'scope':
			scope = Scope.for(ctx, propertyKeys);
			break;
	}
	pool.set(ctx, scope);
	return scope as any as S;
}
