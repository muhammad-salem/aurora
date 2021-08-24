import { Scope, ScopeType } from '../scope.js';

export class Scop<T extends object> implements Scope<T> {
	static for<T extends object>(context: T, type: ScopeType) {
		return new Scop(context, type);
	}
	static blockScopeFor<T extends object>(context: T) {
		return new Scop(context, 'block');
	}
	static functionScopeFor<T extends object>(context: T) {
		return new Scop(context, 'function');
	}
	static emptyBlockScope<T extends object>() {
		return new Scop({} as T, 'block');
	}
	static emptyFunctionScope<T extends object>() {
		return new Scop({} as T, 'function');
	}
	constructor(protected context: T, public type: ScopeType) { }
	get(propertyKey: PropertyKey): any {
		return Reflect.get(this.context, propertyKey);
	}
	set(propertyKey: PropertyKey, value: any, receiver?: any): boolean {
		return Reflect.set(this.context, propertyKey, value);
	}
	has(propertyKey: PropertyKey): boolean {
		return propertyKey in this.context;
	}
	getScopeContext(): T | undefined {
		return this.context;
	}
}

export class ReadOnlyScope<T extends object> extends Scop<T> {
	set(propertyKey: PropertyKey, value: any, receiver?: any): boolean {
		// do nothing
		return false;
	}
}
