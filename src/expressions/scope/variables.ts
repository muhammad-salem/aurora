import { ReactiveScope } from './scope.js';

const INDEX = Symbol('INDEX');
const SCOPE = Symbol('SCOPE');
const UPDATE_FN = Symbol('UPDATE_FN');

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

	createComputed<T>(updateFn: () => T): Variable<T> {
		const index = this.getContext().length;
		this.watchState();
		const value = compute(updateFn);
		const variable = new Variable<T>(this, index, value as T);
		this.observeState(index, updateFn);
		this.restoreState();
		return variable;
	}

	watchState() {
		this.state.push([]);
	}

	observeIndex(index: number) {
		this.state.at(-1)?.push(index);
	}

	observeState(index: number, updateFn: () => any) {
		this.unsubscribe(index);
		const update = () => this.set(index, compute(updateFn));
		const dependencies = this.state.at(-1);
		dependencies?.forEach(i => this.subscribe(i, update));
	}

	restoreState() {
		this.state.pop();
	}

}

export class Variable<T> {

	protected [SCOPE]: VariableScope;
	protected [INDEX]: number;

	constructor(scope: VariableScope, index: number, initValue: T) {
		this[SCOPE] = scope;
		this[INDEX] = index;
		scope.set(index, initValue);
	}

	get(): T {
		this[SCOPE].observeIndex(this[INDEX]);
		return this[SCOPE].get(this[INDEX]);
	}

}

export class LazyVariable<T> extends Variable<T> {
	protected [UPDATE_FN]: () => T;

	constructor(scope: VariableScope, index: number, updateFn: () => T) {
		super(scope, index, compute(updateFn) as T);
		this[UPDATE_FN] = updateFn;
	}

	override get(): T {
		const value = compute(this[UPDATE_FN]);
		this[SCOPE].set(this[INDEX], value);
		return super.get();
	}

}

export class WritableVariable<T> extends Variable<T>{

	constructor(scope: VariableScope, index: number, initValue: T) {
		super(scope, index, initValue);
	}

	set(value: T) {
		this[SCOPE].set(this[INDEX], value);
	}

	update(updateFn: (value: T) => T): void {
		this.set(updateFn(this.get()));
	}

}
