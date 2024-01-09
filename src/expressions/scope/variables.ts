import { ReactiveScope } from './scope.js';

type CleanupFn = () => void;
type CleanupRegister = (cleanupFn?: CleanupFn) => void;


function compute<T>(updateFn: () => T): T | unknown {
	try {
		return updateFn();
	} catch (error) {
		return error;
	}
}

export class VariableScope extends ReactiveScope<Array<any>> {

	private state: number[][] = [];

	constructor() {
		super([]);
	}

	createVariable<T>(initValue: T): WritableVariable<T> {
		return new WritableVariable<T>(this, this.getContext().length, initValue);
	}

	createLazyComputed<T>(updateFn: () => T): LazyVariable<T> {
		return new LazyVariable<T>(this, this.getContext().length, updateFn);
	}

	createComputed<T>(updateFn: () => T): ComputedVariable<T> {
		const index = this.getContext().length;
		this.watchState();
		const value = compute(updateFn);
		const variable = new ComputedVariable<T>(this, index, value as T);
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
		return variable;
	}

	createEffect<T>(effectFn: (onCleanup?: CleanupFn) => T): { destroy(): void } {
		let cleanupFn: (() => void) | undefined;
		const cleanupRegister: CleanupRegister = onClean => cleanupFn = onClean;
		const callback = () => effectFn(cleanupRegister);
		this.watchState();
		compute(callback);
		const observeComputed = () => {
			cleanupFn?.();
			this.watchState();
			compute(callback);
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

	observeIndex(index: number) {
		this.state.at(-1)?.push(index);
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

export abstract class Variable<T> {
	abstract get(): T;
}

export class ComputedVariable<T> extends Variable<T> {

	#index: number;
	#scope: VariableScope;

	constructor(scope: VariableScope, index: number, initValue: T) {
		super();
		this.#scope = scope;
		this.#index = index;
		scope.set(index, initValue);
	}

	get(): T {
		this.#scope.observeIndex(this.#index);
		return this.#scope.get(this.#index);
	}

}

export class LazyVariable<T> extends Variable<T> {

	#index: number;
	#scope: VariableScope;
	#updateFn: () => T;

	constructor(scope: VariableScope, index: number, updateFn: () => T) {
		super();
		this.#scope = scope;
		this.#index = index;
		this.#updateFn = updateFn;
		scope.set(index, compute(updateFn) as T);
	}

	override get(): T {
		const value = compute(this.#updateFn);
		this.#scope.set(this.#index, value);
		this.#scope.observeIndex(this.#index);
		return this.#scope.get(this.#index);
	}

}

export class WritableVariable<T> extends Variable<T> {

	#index: number;
	#scope: VariableScope;

	constructor(scope: VariableScope, index: number, initValue: T) {
		super();
		this.#scope = scope;
		this.#index = index;
		scope.set(index, initValue);
	}

	get(): T {
		this.#scope.observeIndex(this.#index);
		return this.#scope.get(this.#index);
	}

	set(value: T) {
		this.#scope.set(this.#index, value);
	}

	update(updateFn: (value: T) => T): void {
		this.set(updateFn(this.get()));
	}

}
