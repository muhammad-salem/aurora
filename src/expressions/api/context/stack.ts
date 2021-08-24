import type {
	AsyncIterableInfo, AwaitPromiseInfo,
	Scope, ScopeType, Stack as StackInterface
} from '../scope.js';
import { Scop } from './scope.js';

export class Stack implements StackInterface {
	awaitPromise: AwaitPromiseInfo[];
	forAwaitAsyncIterable?: AsyncIterableInfo | undefined;

	protected readonly stack: Array<Scope<any>> = [];

	has(propertyKey: PropertyKey): boolean {
		return this.stack.find(context => context.has(propertyKey)) ? true : false;
	}
	get(propertyKey: PropertyKey) {
		return this.findScope(propertyKey).get(propertyKey);
	}
	set(propertyKey: PropertyKey, value: any, receiver?: any): boolean {
		return this.findScope(propertyKey).set(propertyKey, value, receiver);
	}
	declareVariable(scopeType: ScopeType, propertyKey: PropertyKey, propertyValue?: any) {
		if (scopeType === 'block') {
			return this.stack[0].set(propertyKey, propertyValue);
		}
		for (const scope of this.stack) {
			if (scope.type === scopeType) {
				scope.set(propertyKey, propertyValue);
				break;
			}
		}
	}
	findScope<T = any>(propertyKey: PropertyKey): Scope<T> {
		let lastIndex = this.stack.length;
		while (lastIndex--) {
			const scope = this.stack[lastIndex];
			if (scope.has(propertyKey)) {
				return scope;
			}
		}
		return this.stack[0];
	}
	resolveAwait(value: AwaitPromiseInfo): void {
		this.awaitPromise.push(value);
	}
	popScope<T = any>(): Scope<T> {
		return this.stack.pop()!;
	}
	removeScope<T = any>(scope: Scope<T>): void {
		const index = this.stack.lastIndexOf(scope);
		this.stack.splice(index, 1);
	}
	pushScope<T extends object>(scope: Scope<T>): void {
		this.stack.push(scope);
	}
	pushBlockScope<T extends object>(): Scope<T> {
		const scope = Scop.emptyBlockScope<T>();
		this.stack.push(scope);
		return scope;
	}
	pushFunctionScope<T extends object>(): Scope<T> {
		const scope = Scop.emptyFunctionScope<T>();
		this.stack.push(scope);
		return scope;
	}
	pushBlockScopeFor<T extends object>(context: T): Scope<T> {
		const scope = Scop.blockScopeFor(context);
		this.stack.push(scope);
		return scope;
	}
	pushFunctionScopeFor<T extends object>(context: T): Scope<T> {
		const scope = Scop.functionScopeFor(context);
		this.stack.push(scope);
		return scope;
	}

}
