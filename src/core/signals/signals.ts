import { SignalScope } from '@ibyar/expressions';

let signalScope: SignalScope | undefined;


export function setSignalScope(scope: SignalScope) {
	signalScope = scope;
}

export function clearSignalScope() {
	signalScope = undefined;
}

function isValidContext(): void {
	if (!signalScope) {
		throw new Error('Create a Signal, Computed and Effect is only allowed in class constructor.');
	}
}

export function signalNode<T>(initialValue: T) {
	isValidContext();
	return signalScope!.createSignal(initialValue);
}

export function signal<T>(initialValue: T) {
	isValidContext();
	return signalScope!.createSignalFn(initialValue);
}

export function computedNode<T>(computation: () => T) {
	isValidContext();
	return signalScope!.createComputed(computation);
}

export function computed<T>(computation: () => T) {
	isValidContext();
	return signalScope!.createComputedFn(computation);
}

export function lazyNode<T>(computation: () => T) {
	isValidContext();
	return signalScope!.createLazy(computation);
}

export function lazy<T>(computation: () => T) {
	isValidContext();
	return signalScope!.createLazyFn(computation);
}

const effectState: SignalScope[] = [];
type EffectFn = (onCleanup?: (clean: () => void) => void) => void;
function wrapEffect<T>(scope: SignalScope, effectFn: EffectFn): EffectFn {
	return (onCleanup) => {
		effectState.push(scope);
		effectFn(onCleanup);
		effectState.pop();
	};
}


export function effect(effectFn: (onCleanup?: (clean: () => void) => void) => void) {
	isValidContext();
	return signalScope!.createEffect(wrapEffect(signalScope!, effectFn));
}

export function untracked<T>(nonReactiveReadsFn: () => T): T {
	const scope = effectState.at(-1);
	scope?.untrack();
	const value = nonReactiveReadsFn();
	scope?.track();
	return value;
}
