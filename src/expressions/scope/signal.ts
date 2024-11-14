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

	createSignal<T, S = SignalType<T>>(initValue?: T, signalType = Signal as SignalType<T>): S {
		const signal = new signalType(this, this.getContext().length, initValue);
		signalType.bindNode(signal);
		return signal as S;
	}

	createSignalFn<T>(initValue: T, signalType = Signal as SignalType<T>) {
		const signal = new signalType(this, this.getContext().length, initValue);
		return signalType.toReactiveSignal(signal);
	}

	createLazy<T>(updateFn: () => T): Lazy<T> {
		const lazy = new Lazy<T>(this, this.getContext().length, updateFn);
		Lazy.bindNode(lazy);
		return lazy;
	}

	createLazyFn<T>(updateFn: () => T) {
		const lazy = new Lazy<T>(this, this.getContext().length, updateFn);
		return Lazy.toReactiveSignal(lazy);
	}

	createComputed<T>(updateFn: () => T): Computed<T> {
		const index = this.getContext().length;
		this.watchState();
		const value = compute(updateFn);
		const computed = new Computed<T>(this, index, value as T);
		Computed.bindNode(computed);
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

	createComputedFn<T>(updateFn: () => T) {
		const computed = this.createComputed(updateFn);
		return Computed.toReactiveSignal(computed);
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

	static bindNode<T>(instance: ReactiveNode<T>) {
		instance.get = instance.get.bind(instance);
	}

	static toReactiveSignal<T>(instance: ReadOnlySignal<T>): ReactiveSignal<T> {
		const fn = () => instance.get();
		fn[SIGNAL] = instance;
		return fn as ReactiveSignal<T>;
	}

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

const SIGNAL = Symbol('Signal');

export interface Reactive<T> {
	[SIGNAL]: ReactiveNode<T>;
}

export function isReactive<T = any>(value: unknown): value is Reactive<T> {
	const node = (value as Partial<Reactive<T>>)?.[SIGNAL];
	return node !== undefined && node instanceof ReactiveNode;
}

export function getReactiveNode<T = any>(value: unknown): ReactiveNode<T> | void {
	if (value instanceof ReactiveNode) {
		return value;
	} else if (isReactive(value)) {
		return value[SIGNAL];
	}
}

export type ReactiveSignal<T> = (() => T) & {
	/**
	 * original node that can access value from scope
	 */
	[SIGNAL]: unknown;
};

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

export type WritableSignal<T> = ReactiveSignal<T> & {
	set(value: T): void;
	update(updateFn: (value: T) => T): void;
};

export type SignalType<T, S = Signal<T>> = {
	new(scope: SignalScope, index: number, initValue?: T): S;
	bindNode<T>(signal: Signal<T>): void;
	toReactiveSignal<T>(signal: Signal<T>): WritableSignal<T>;
};

export class Signal<T> extends ReactiveNode<T> {

	static bindNode<T>(signal: Signal<T>) {
		signal.get = signal.get.bind(signal);
		signal.set = signal.set.bind(signal);
		signal.update = signal.update.bind(signal);
	}

	static toReactiveSignal<T>(signal: Signal<T>): WritableSignal<T> {
		const fn = () => signal.get();
		fn.set = (value: T) => signal.set(value);
		fn.update = (updateFn: (value: T) => T) => signal.update(updateFn);
		fn[SIGNAL] = signal;
		return fn as WritableSignal<T>;
	}

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
		return ReadOnlySignal.toReactiveSignal(new ReadOnlySignal(this.scope, this.index));
	}

	asReadonlyNode() {
		const node = new ReadOnlySignal(this.scope, this.index);
		ReadOnlySignal.bindNode(node)
		return node;
	}

}

export class ReadOnlySignal<T> extends ReactiveNode<T> {

}

export class SignalValueScope<T> extends ReactiveScope<Record<PropertyKey, any>> {
	constructor() {
		super({});
	}

	watchSignal(propertyKey: keyof T, node: ReactiveNode<any>) {
		this.set(propertyKey, node.get());
		return node.subscribe(value => this.set(propertyKey, value));
	}

}
