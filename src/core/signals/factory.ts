import { ReactiveNode, SignalScope } from '@ibyar/expressions';

type EffectFn = (onCleanup?: (clean: () => void) => void) => void;

class SignalScopeFactory {

	private scopes: SignalScope[] = [SignalScope.create()];
	private effectState: SignalScope[] = [];

	push(scope: SignalScope) {
		this.scopes.push(scope);
	}

	pop(scop: SignalScope) {
		if (this.scopes.pop() !== scop) {
			throw new Error('expect scope is not matching');
		}
	}

	signal<T>(initialValue: T) {
		this.assertValidContext();
		return this.scopes.at(-1)!.createSignal(initialValue);
	}

	signalFn<T>(initialValue: T) {
		this.assertValidContext();
		return this.scopes.at(-1)!.createSignalFn(initialValue);
	}

	computed<T>(computation: () => T) {
		this.assertValidContext();
		return this.scopes.at(-1)!.createComputed(computation);
	}
	computedFn<T>(computation: () => T) {
		this.assertValidContext();
		return this.scopes.at(-1)!.createComputedFn(computation);
	}

	lazy<T>(computation: () => T) {
		this.assertValidContext();
		return this.scopes.at(-1)!.createLazy(computation);
	}
	lazyFn<T>(computation: () => T) {
		this.assertValidContext();
		return this.scopes.at(-1)!.createLazyFn(computation);
	}
	effect(effectFn: (onCleanup?: (clean: () => void) => void) => void) {
		this.assertValidContext();
		const scope = this.scopes.at(-1)!;
		return scope.createEffect(this.wrapEffect(scope, effectFn));
	}
	untracked<T>(reactiveNode: ReactiveNode<T>): T;
	untracked<T>(nonReactiveReadsFn: () => T): T;
	untracked<T>(nonReactiveReads: (() => T) | ReactiveNode<T>): T {
		const scope = this.effectState.at(-1);
		scope?.untrack();
		const value = nonReactiveReads instanceof ReactiveNode
			? nonReactiveReads.get()
			: nonReactiveReads();
		scope?.track();
		return value;
	}
	private assertValidContext(): void {
		if (this.scopes.length <= 0) {
			throw new Error('Create a Signal, Computed and Effect is only allowed in class constructor.');
		}
	}
	private wrapEffect<T>(scope: SignalScope, effectFn: EffectFn): EffectFn {
		return (onCleanup) => {
			this.effectState.push(scope);
			effectFn(onCleanup);
			this.effectState.pop();
		};
	}
}

export const signalScopeFactory = new SignalScopeFactory();
