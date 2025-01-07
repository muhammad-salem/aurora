import { Context, ReactiveScope, ReactiveControlScope, ReadOnlyScope, Scope } from './scope.js';

export class ScopeBuilder {
	static for<T extends Context>(ctx: T, propertyKeys?: (keyof T)[]) {
		return new Scope(ctx, propertyKeys);
	}
	static blockScope<T extends Context>(propertyKeys?: (keyof T)[]) {
		return new Scope({} as T, propertyKeys);
	}
	static readOnlyScopeFor<T extends Context>(ctx: T, propertyKeys?: (keyof T)[]) {
		return new ReadOnlyScope(ctx, propertyKeys);
	}
	static blockReadOnlyScope<T extends Context>(propertyKeys?: (keyof T)[]) {
		return new ReadOnlyScope({} as T, propertyKeys);
	}
	static reactiveScopeFor<T extends Context>(context: T, propertyKeys?: (keyof T)[]) {
		return new ReactiveScope(context, propertyKeys);
	}
	static blockReactiveScope<T extends Context>(propertyKeys?: (keyof T)[]) {
		return new ReactiveScope({} as T, propertyKeys);
	}
	static reactiveScopeForThis<T extends Context>(ctx: T, propertyKeys?: (keyof T)[]) {
		const thisScope = ReactiveScope.for(ctx, propertyKeys);
		const thisCtx = {
			'this': ctx,
		};
		const rootScope = Scope.for(thisCtx, ['this']);
		rootScope.setInnerScope('this', thisScope);
		return rootScope;
	}
	static readOnlyScopeAndReactiveScopeForThis<T extends Context>(ctx: T, propertyKeys?: (keyof T)[]) {
		const thisScope = ReactiveScope.for(ctx, propertyKeys);
		const thisCtx = {
			'this': ctx,
		};
		const rootScope = ReadOnlyScope.for(thisCtx, ['this']);
		rootScope.setInnerScope('this', thisScope);
		return rootScope;
	}
	static reactiveScopeAndScopeForThis<T extends Context>(ctx: T, propertyKeys?: (keyof T)[]) {
		const thisScope = ReactiveScope.for(ctx, propertyKeys);
		const thisCtx = {
			'this': ctx,
		};
		const rootScope = Scope.for(thisCtx, ['this']);
		rootScope.setInnerScope('this', thisScope);
		return rootScope;
	}
	static reactiveScopeControlFor<T extends Context>(context: T, propertyKeys?: (keyof T)[]) {
		return new ReactiveControlScope(context, propertyKeys);
	}
	static blockReactiveScopeControl<T extends Context>(propertyKeys?: (keyof T)[]) {
		return new ReactiveControlScope({} as T, propertyKeys);
	}
	static reactiveScopeControlForThis<T extends Context>(ctx: T, propertyKeys?: (keyof T)[]) {
		const thisScope = ReactiveControlScope.for(ctx, propertyKeys);
		const thisCtx = {
			'this': ctx,
		};
		const rootScope = Scope.for(thisCtx, ['this']);
		rootScope.setInnerScope('this', thisScope);
		return rootScope;
	}
	static readOnlyScopeAndReactiveScopeControlForThis<T extends Context>(ctx: T, propertyKeys?: (keyof T)[]) {
		const thisScope = ReactiveControlScope.for(ctx, propertyKeys);
		const thisCtx = {
			'this': ctx,
		};
		const rootScope = ReadOnlyScope.for(thisCtx, ['this']);
		rootScope.setInnerScope('this', thisScope);
		return rootScope;
	}
}
