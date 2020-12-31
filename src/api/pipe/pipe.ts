import { WindowContextProvider } from '../global/global-constant.js';
import { ContextProvider } from '../context/context-provider.js';
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
    return Reflect.has(obj.__proto__, 'transform');
}

export class PipeContextProvider<T extends any, U extends any> implements ContextProvider<PipeTransform<T, U>> {
    next = WindowContextProvider;
    pipeCacheMap: Map<string, PipeTransform<T, U>> = new Map();
    getContext(entityName: string): ContextProvider<any> | undefined {
        if (this.pipeCacheMap.has(entityName)) {
            return this;
        }
        const pipeRef = ClassRegistryProvider.getPipe<any>(entityName);
        if (pipeRef) {
            return this;
        }
        return this.next.getContext(entityName);
    }
    getProvider(entityName: string): {} | undefined {
        if (this.pipeCacheMap.has(entityName)) {
            const cachedPipe = this.pipeCacheMap.get(entityName);
            return cachedPipe?.transform.bind(cachedPipe);
        }
        const pipeRef = ClassRegistryProvider.getPipe<PipeTransform<T, U>>(entityName);
        if (pipeRef) {
            const cachedPipe = new pipeRef.modelClass();
            this.pipeCacheMap.set(pipeRef.name, cachedPipe);
            return cachedPipe.transform.bind(cachedPipe);
        }
        return this.next.getProvider(entityName);
    }
}

export const PIPE_CONTEXT_PROVIDER = new PipeContextProvider();
export default PIPE_CONTEXT_PROVIDER;
