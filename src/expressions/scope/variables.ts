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
	private watch = true;

	constructor() {
		super([]);
	}

	createVariable<T>(initValue: T): WritableVariable<T> {
		const writable = new WritableVariable<T>(this, this.getContext().length, initValue);
		WritableVariable.bindFn(writable);
		return writable;
	}
	createVariableFn<T>(initValue: T) {
		const writable = new WritableVariable<T>(this, this.getContext().length, initValue);
		return WritableVariable.writable(writable);
	}

	createLazyComputed<T>(updateFn: () => T): LazyVariable<T> {
		const lazy = new LazyVariable<T>(this, this.getContext().length, updateFn);
		LazyVariable.bindFn(lazy);
		return lazy;
	}

	createLazyComputedFn<T>(updateFn: () => T) {
		const lazy = new LazyVariable<T>(this, this.getContext().length, updateFn);
		return LazyVariable.lazy(lazy);
	}

	createComputed<T>(updateFn: () => T): ComputedVariable<T> {
		const index = this.getContext().length;
		this.watchState();
		const value = compute(updateFn);
		const variable = new ComputedVariable<T>(this, index, value as T);
		ComputedVariable.bindFn(variable);
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

	createComputedFn<T>(updateFn: () => T) {
		const instance = this.createComputed(updateFn);
		return ComputedVariable.computed(instance);
	}

	createEffect(effectFn: (onCleanup?: CleanupFn) => void): { destroy(): void } {
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

export abstract class Variable<T> {
	abstract get(): T;
}

export const Signal = Symbol('Signal') as symbol;

export class ComputedVariable<T> extends Variable<T> {

	static bindFn<T>(instance: ComputedVariable<T>) {
		instance.get = instance.get.bind(instance);
	}

	static computed<T>(instance: ComputedVariable<T>) {
		const fn = () => instance.get();
		(fn as any)[Signal] = instance;
		return fn;
	}

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

	static bindFn<T>(instance: LazyVariable<T>) {
		instance.get = instance.get.bind(instance);
	}

	static lazy<T>(instance: LazyVariable<T>) {
		const fn = () => instance.get();
		(fn as any)[Signal] = instance;
		return fn;
	}

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

	static bindFn<T>(instance: WritableVariable<T>) {
		instance.get = instance.get.bind(instance);
		instance.set = instance.set.bind(instance);
		instance.update = instance.update.bind(instance);
	}

	static writable<T>(instance: WritableVariable<T>) {
		const fn = () => instance.get();
		fn.set = (value: T) => instance.set(value);
		fn.update = (updateFn: (value: T) => T) => instance.update(updateFn);
		(fn as any)[Signal] = instance;
		return fn;
	}

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
