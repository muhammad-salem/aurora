import { ReactiveScope, ValueChangedCallback } from './scope.js';

export type CleanupFn = () => void;
export type CleanupRegister = (cleanupFn?: CleanupFn) => void;
export type SignalDestroyRef = { destroy(): void };

function compute<T>(updateFn: () => T): T | unknown {
	try {
		return updateFn();
	} catch (error) {
		return error;
	}
}

export class SignalScope extends ReactiveScope<Array<any>> {

	static create() {
		return new SignalScope();
	}

	private state: number[][] = [];
	private watch = true;

	constructor() {
		super([]);
	}

	getNextKey() {
		return this.getContext().length;
	}

	createSignal<T>(initValue?: T): Signal<T> {
		return new Signal(this, this.getContext().length, initValue);
	}

	createLazy<T>(updateFn: () => T): Lazy<T> {
		return new Lazy<T>(this, this.getContext().length, updateFn);
	}

	createComputed<T>(updateFn: () => T): Computed<T> {
		const index = this.getContext().length;
		this.watchState();
		const value = compute(updateFn);
		const computed = new Computed<T>(this, index, value as T);
		const observeComputed = () => {
			this.watchState();
			const value = compute(updateFn);
			const state = this.readState();
			this.restoreState();
			Object.keys(subscriptions)
				.filter(index => !state.includes(+index))
				.forEach(index => subscriptions[index].pause());
			state.forEach(index => {
				subscriptions[index]?.resume();
				subscriptions[index] ??= this.subscribe(index, observeComputed);
			});
			this.set(index, value);
		};
		const subscriptions = this.observeState(observeComputed);
		this.restoreState();
		return computed;
	}

	createEffect(effectFn: (onCleanup?: CleanupFn) => void): SignalDestroyRef {
		let cleanupFn: (() => void) | undefined;
		let isCleanupRegistered = false;
		const cleanupRegister: CleanupRegister = onClean => {
			cleanupFn = onClean;
			isCleanupRegistered = true;
		};
		const callback = () => {
			isCleanupRegistered = false;
			const error = compute(() => effectFn(cleanupRegister)) as any;
			if (error instanceof Error) {
				console.error(error);
			}
			if (!isCleanupRegistered) {
				cleanupFn = undefined;
			}
		};
		this.watchState();
		callback();
		const observeComputed = () => {
			cleanupFn?.();
			this.watchState();
			callback();
			const state = this.readState();
			this.restoreState();
			Object.keys(subscriptions)
				.filter(index => !state.includes(+index))
				.forEach(index => subscriptions[index].pause());
			state.forEach(index => {
				subscriptions[index]?.resume();
				subscriptions[index] ??= this.subscribe(index, observeComputed);
			});
		};
		const subscriptions = this.observeState(observeComputed);
		this.restoreState();
		return {
			destroy: () => {
				Object.values(subscriptions).forEach(sub => sub.unsubscribe());
				cleanupFn?.();
			},
		};
	}

	watchState() {
		this.state.push([]);
	}

	untrack() {
		this.watch = false;
	}

	observeIndex(index: number) {
		if (this.watch) {
			this.state.at(-1)?.push(index);
		}
	}

	track() {
		this.watch = true;
	}

	readState() {
		return this.state.at(-1) ?? [];
	}

	observeState(updateFn: () => void) {
		return Object.fromEntries(this.readState().map(index => [index, this.subscribe(index, updateFn)]));
	}

	restoreState() {
		this.state.pop();
	}

}

export abstract class ReactiveNode<T> {

	constructor(protected scope: SignalScope, protected index: number) { }

	get(): T {
		this.scope.observeIndex(this.index);
		return this.scope.get(this.index);
	}

	getScope(): SignalScope {
		return this.scope;
	}

	getIndex(): number {
		return this.index;
	}

	subscribe(callback: ValueChangedCallback) {
		return this.scope.subscribe(this.index, callback);
	}

}

export class Computed<T> extends ReactiveNode<T> {

	constructor(scope: SignalScope, index: number, initValue: T) {
		super(scope, index);
		scope.set(index, initValue);
	}

}

export class Lazy<T> extends ReactiveNode<T> {

	private updateFn: () => T;

	constructor(scope: SignalScope, index: number, updateFn: () => T) {
		super(scope, index);
		this.updateFn = updateFn;
		scope.set(index, compute(updateFn) as T);
	}

	override get(): T {
		const value = compute(this.updateFn);
		this.scope.set(this.index, value);
		return super.get();
	}

}

export class Signal<T> extends ReactiveNode<T> {

	constructor(scope: SignalScope, index: number, initValue?: T) {
		super(scope, index);
		scope.set(index, initValue);
	}

	set(value: T) {
		this.scope.set(this.index, value);
	}

	update(updateFn: (value: T) => T): void {
		this.set(updateFn(this.get()));
	}

	asReadonly() {
		return new ReadOnlySignal(this.scope, this.index);
	}

}

export class ReadOnlySignal<T> extends ReactiveNode<T> {

}


export function isSignal<T = any>(signal: unknown): signal is Signal<T> {
	return signal instanceof Signal;
}

export function isReactiveNode<T = any>(signal: unknown): signal is ReactiveNode<T> {
	return signal instanceof ReactiveNode;
}
