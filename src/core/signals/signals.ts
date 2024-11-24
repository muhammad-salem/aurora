import { ReactiveNode, SignalScope } from '@ibyar/expressions';
import { signalScopeFactory } from './factory.js';

export function pushNewSignalScope() {
	const scope = SignalScope.create();
	signalScopeFactory.push(scope);
	return scope;
}

export function pushSignalScope(scope: SignalScope) {
	signalScopeFactory.push(scope);
}

export function clearSignalScope(scope: SignalScope) {
	signalScopeFactory.pop(scope);
}

export function signal<T>(initialValue?: T) {
	return signalScopeFactory.signal(initialValue);
}

export function signalFn<T>(initialValue: T) {
	return signalScopeFactory.signalFn(initialValue);
}

export function computed<T>(computation: () => T) {
	return signalScopeFactory.computed(computation);
}

export function computedFn<T>(computation: () => T) {
	return signalScopeFactory!.computedFn(computation);
}

export function lazy<T>(computation: () => T) {
	return signalScopeFactory.lazy(computation);
}

export function lazyFn<T>(computation: () => T) {
	return signalScopeFactory.lazyFn(computation);
}

export function effect(effectFn: (onCleanup?: (clean: () => void) => void) => void) {
	return signalScopeFactory.effect(effectFn);
}
export function untracked<T>(reactiveNode: ReactiveNode<T>): T;
export function untracked<T>(nonReactiveReadsFn: () => T): T;
export function untracked<T>(nonReactiveReads: (() => T) | ReactiveNode<T>): T {
	return signalScopeFactory.untracked(nonReactiveReads as ReactiveNode<T>);
}
