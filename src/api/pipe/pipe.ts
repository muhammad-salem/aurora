import { ContextDescriptorRef, ContextProvider } from '../context/context-provider.js';
import ClassRegistryProvider from '../providers/provider.js';

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

export function isPipeTransform<T extends any, U extends any>(obj: any): obj is PipeTransform<T, U> {
	return Reflect.has(Object.getPrototypeOf(obj), 'transform');
}

export class PipeContextProvider<T extends ContextDescriptorRef, U extends ContextDescriptorRef> implements ContextProvider<PipeTransform<T, U>> {
	pipeCacheMap: Map<string, PipeTransform<T, U>> = new Map();
	getContext(entityName: string): undefined {
		return void 0;
	}
	getContextValue(entityName: string): any {
		let cachedPipe: PipeTransform<T, U> | undefined;
		if (cachedPipe = this.pipeCacheMap.get(entityName)) {
			return cachedPipe.transform.bind(cachedPipe);
		}
		const pipeRef = ClassRegistryProvider.getPipe<PipeTransform<T, U>>(entityName);
		if (pipeRef && !pipeRef.asynchronous) {
			cachedPipe = new pipeRef.modelClass();
			this.pipeCacheMap.set(pipeRef.name, cachedPipe);
			return cachedPipe.transform.bind(cachedPipe);
		}
		throw new Error(`no pipe found for ${entityName}.`);
	}
	setContextValue(entityName: PropertyKey, value: any): boolean {
		throw new Error("Pipes provider has no set implementation.");
	}
	hasContext(entityName: string): boolean {
		if (this.pipeCacheMap.has(entityName)) {
			return true;
		}
		const pipeRef = ClassRegistryProvider.getPipe<PipeTransform<T, U>>(entityName);
		return pipeRef !== undefined && !pipeRef.asynchronous;
	}
}

export class AsyncPipeContext<T extends ContextDescriptorRef, U extends ContextDescriptorRef> implements ContextProvider<PipeTransform<T, U>> {
	constructor(private context: PipeTransform<T, U>) { }
	getContext(entityName: string): PipeTransform<T, U> | undefined {
		return this.context;
	}
	getContextValue(entityName: string) {
		return this.context.transform.bind(this.context);
	}
	setContextValue(entityName: PropertyKey, value: any): boolean {
		throw new Error("Async Pipes provider has no set implementation.");
	}
	hasContext(entityName: string): boolean {
		throw new Error("it should never been called.");
	}
}

export class AsyncPipeContextProvider<T extends ContextDescriptorRef, U extends ContextDescriptorRef> implements ContextProvider<AsyncPipeContext<T, U>> {
	getContext(entityName: string): AsyncPipeContext<T, U> | undefined {
		const pipeRef = ClassRegistryProvider.getPipe<PipeTransform<T, U>>(entityName);
		if (pipeRef && pipeRef.asynchronous) {
			let cachedPipe: PipeTransform<T, U> | undefined;
			cachedPipe = new pipeRef.modelClass();
			return new AsyncPipeContext(cachedPipe);
		}
		return void 0;
	}
	getContextValue(entityName: string) {
		return (...args: any) => { };
	}
	setContextValue(entityName: PropertyKey, value: any): boolean {
		throw new Error("Async Pipes provider has no set implementation.");
	}
	hasContext(entityName: string): boolean {
		const pipeRef = ClassRegistryProvider.getPipe<PipeTransform<T, U>>(entityName);
		return pipeRef !== undefined && pipeRef.asynchronous === true;
	}
}

export const PIPE_CONTEXT_PROVIDER = new PipeContextProvider();
export const ASYNC_PIPE_CONTEXT_PROVIDER = new AsyncPipeContextProvider();
