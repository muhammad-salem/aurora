import { ReadOnlyScopedContext } from '@ibyar/expressions';
import { defineModel, Model } from '../model/change-detection.js';
import { ClassRegistryProvider } from '../providers/provider.js';

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

export function isPipeTransform<T extends any, U extends any>(pipe: any): pipe is PipeTransform<T, U> {
	return Reflect.has(Object.getPrototypeOf(pipe), 'transform');
}

export class PipeProvider extends ReadOnlyScopedContext<Map<string, Function>> {
	static PipeContext = new Map<string, Function>();
	constructor() {
		super(PipeProvider.PipeContext);
	}
	has(pipeName: string): boolean {
		if (this.context.has(pipeName)) {
			return true;
		}
		const pipeRef = ClassRegistryProvider.getPipe<PipeTransform<any, any>>(pipeName);
		return pipeRef !== undefined && !pipeRef.asynchronous;
	}
	get(pipeName: string): any {
		let transformFunc: Function | undefined;
		if (transformFunc = this.context.get(pipeName)) {
			return transformFunc;
		}
		const pipeRef = ClassRegistryProvider.getPipe<PipeTransform<any, any>>(pipeName);
		if (pipeRef !== undefined && !pipeRef.asynchronous) {
			const pipe = new pipeRef.modelClass();
			transformFunc = pipe.transform.bind(pipe);
			this.context.set(pipeRef.name, transformFunc);
			return transformFunc;
		}
		return void 0;
	}
}

export class AsyncPipeProvider extends ReadOnlyScopedContext<object> {

	static AsyncPipeContext = Object.create(null);
	constructor() {
		super(AsyncPipeProvider.AsyncPipeContext);
	}
	has(pipeName: string): boolean {
		const pipeRef = ClassRegistryProvider.getPipe<PipeTransform<any, any>>(pipeName);
		return pipeRef?.asynchronous ? true : false;
	}
	get(pipeName: string): PipeTransform<any, any> | undefined {
		const pipeRef = ClassRegistryProvider.getPipe<PipeTransform<any, any>>(pipeName);
		if (pipeRef?.asynchronous) {
			return new pipeRef.modelClass();
		}
		return void 0;
	}
}
