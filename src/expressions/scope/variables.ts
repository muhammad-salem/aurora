import { ReactiveScope } from './scope.js';

function compute<T>(computation: () => T): T | unknown {
	try {
		return computation();
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

	createLazyComputed<T>(computation: () => T): LazyVariable<T> {
		return new LazyVariable<T>(this, this.getContext().length, computation);
	}

	createComputed<T>(computation: () => T): Variable<T> {
		const index = this.getContext().length;
		this.watchState();
		const value = compute(computation);
		const variable = new Variable<T>(this, index, value as T);
		this.observeState(index, computation);
		this.restoreState();
		return variable;
	}

	watchState() {
		this.state.push([]);
	}

	observeIndex(index: number) {
		this.state.at(-1)?.push(index);
	}

	observeState(index: number, computation: () => any) {
		this.unsubscribe(index);
		const update = () => this.set(index, compute(computation));
		const dependencies = this.state.at(-1);
		dependencies?.forEach(i => this.subscribe(i, update));
	}

	restoreState() {
		this.state.pop();
	}

}

export class Variable<T> {

	constructor(protected scope: VariableScope, protected index: number, initValue: T) {
		this.scope.set(index, initValue);
	}

	get(): T {
		this.scope.observeIndex(this.index);
		return this.scope.get(this.index);
	}

}

export class LazyVariable<T> extends Variable<T> {

	constructor(scope: VariableScope, index: number, protected computation: () => T) {
		super(scope, index, compute(computation) as T);
	}

	override get(): T {
		const value = compute(this.computation);
		this.scope.set(this.index, value);
		return super.get();
	}

}

export class WritableVariable<T> extends Variable<T>{

	constructor(scope: VariableScope, index: number, initValue: T) {
		super(scope, index, initValue);
	}

	set(value: T) {
		this.scope.set(this.index, value);
	}

	update(mutFn: (value: T) => T): void {
		this.set(mutFn(this.get()));
	}

}
