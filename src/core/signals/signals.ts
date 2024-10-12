import { SignalScope } from '@ibyar/expressions';
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

export function signalNode<T>(initialValue: T) {
	return signalScopeFactory.signalNode(initialValue);
}

export function signal<T>(initialValue: T) {
	return signalScopeFactory.signal(initialValue);
}

export function computedNode<T>(computation: () => T) {
	return signalScopeFactory.computedNode(computation);
}

export function computed<T>(computation: () => T) {
	return signalScopeFactory!.computed(computation);
}

export function lazyNode<T>(computation: () => T) {
	return signalScopeFactory.lazyNode(computation);
}

export function lazy<T>(computation: () => T) {
	return signalScopeFactory.lazy(computation);
}

export function effect(effectFn: (onCleanup?: (clean: () => void) => void) => void) {
	return signalScopeFactory.effect(effectFn);
}

export function untracked<T>(nonReactiveReadsFn: () => T): T {
	return signalScopeFactory.untracked(nonReactiveReadsFn);
}
