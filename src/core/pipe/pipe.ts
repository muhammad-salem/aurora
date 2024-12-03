import { ReactiveControlScope, ReadOnlyScope, ScopeSubscription } from '@ibyar/expressions';
import { OnDestroy } from '../component/lifecycle.js';
import { ChangeDetectorRef, createChangeDetectorRef } from '../linker/change-detector-ref.js';
import { classRegistryProvider } from '../providers/provider.js';
import { Type } from '../utils/typeof.js';

/**
 * Pipes are used as singleton
 * it will be created if it needed, had no life cycle
 * 
 * * no dependency injection applied on filters for now,
 * TODO: add support of dependency injection
 */
export interface PipeTransform<T, U> {
	transform(value: T, ...args: any[]): U;
}

export abstract class AsyncPipeTransform<T, U> implements PipeTransform<T, U>, OnDestroy {
	constructor(protected changeDetectorRef: ChangeDetectorRef) { }
	abstract transform(value: T, ...args: any[]): U;
	abstract onDestroy(): void;
}

export function isPipeTransform<T extends any, U extends any>(pipe: any): pipe is PipeTransform<T, U> {
	return Reflect.has(Object.getPrototypeOf(pipe), 'transform');
}

export class PipeProvider extends ReadOnlyScope<{ [pipeName: string]: Function }> {
	constructor() {
		super({});
	}
	has(pipeName: string): boolean {
		if (pipeName in this._ctx) {
			return true;
		}
		const pipeRef = classRegistryProvider.getPipe<PipeTransform<any, any>>(pipeName);
		return pipeRef !== undefined && !pipeRef.asynchronous;
	}
	get(pipeName: string): any {
		let transformFunc: Function | undefined;
		if (transformFunc = this._ctx[pipeName]) {
			return transformFunc;
		}
		const pipeRef = classRegistryProvider.getPipe<PipeTransform<any, any>>(pipeName);
		if (pipeRef !== undefined && !pipeRef.asynchronous) {
			const pipe = new pipeRef.modelClass();
			transformFunc = (value: any, ...args: any[]) => pipe.transform(value, ...args);
			this._ctx[pipeRef.name] = transformFunc;
			return transformFunc;
		}
		return void 0;
	}
	getClass(): Type<PipeProvider> {
		return PipeProvider;
	}
}

export class AsyncPipeProvider extends ReadOnlyScope<object> {
	constructor() {
		super({});
	}
	has(pipeName: string): boolean {
		const pipeRef = classRegistryProvider.getPipe<AsyncPipeTransform<any, any>>(pipeName);
		return pipeRef?.asynchronous ? true : false;
	}
	get(pipeName: string): Type<AsyncPipeTransform<any, any>> | undefined {
		const pipeRef = classRegistryProvider.getPipe<AsyncPipeTransform<any, any>>(pipeName);
		if (pipeRef?.asynchronous) {
			return pipeRef.modelClass;
		}
		return;
	}
	getClass(): Type<AsyncPipeProvider> {
		return AsyncPipeProvider;
	}
}

export class AsyncPipeScope<T extends { [key: string]: AsyncPipeTransform<any, any> }> extends ReactiveControlScope<T> {
	static blockScope<P extends { [key: string]: AsyncPipeTransform<any, any> }>(): AsyncPipeScope<P> {
		return new AsyncPipeScope();
	}
	private wrapper: { [key: string]: Function } = {};
	constructor() {
		super({} as T);
	}
	override set(propertyKey: keyof T, pipeClass: Type<AsyncPipeTransform<any, any>>, receiver?: any): boolean {
		const detector = createChangeDetectorRef(this, propertyKey);
		const pipe = new pipeClass(detector);
		const result = super.set(propertyKey, pipe, receiver);
		if (result) {
			this.wrapper[propertyKey as string] = (value: any, ...args: any[]) => {
				return pipe.transform(value, ...args)
			};
		}
		return result;
	}
	override get(propertyKey: keyof T): any {
		return Reflect.get(this.wrapper, propertyKey);
	}
	override unsubscribe(propertyKey: keyof T, subscription?: ScopeSubscription<T>) {
		super.unsubscribe(propertyKey, subscription);
		const pipe = this._ctx[propertyKey];
		pipe.onDestroy();
	}
	getClass(): Type<AsyncPipeScope<T>> {
		return AsyncPipeScope;
	}
}
