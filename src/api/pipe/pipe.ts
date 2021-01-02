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
    return Reflect.has(obj.__proto__, 'transform');
}

export class PipeContextProvider<T extends ContextDescriptorRef, U extends ContextDescriptorRef> implements ContextProvider<PipeTransform<T, U>> {
    pipeCacheMap: Map<string, PipeTransform<T, U>> = new Map();
    hasProvider(entityName: string): boolean {
        return this.pipeCacheMap.has(entityName) || ClassRegistryProvider.getPipe<any>(entityName) !== undefined;
    }
    getProvider(entityName: string): ContextDescriptorRef {
        let cachedPipe: PipeTransform<T, U> | undefined;
        if (cachedPipe = this.pipeCacheMap.get(entityName)) {
            return cachedPipe.transform.bind(cachedPipe);
        }
        const pipeRef = ClassRegistryProvider.getPipe<PipeTransform<T, U>>(entityName);
        if (pipeRef) {
            cachedPipe = new pipeRef.modelClass();
            this.pipeCacheMap.set(pipeRef.name, cachedPipe);
            return cachedPipe.transform.bind(cachedPipe);
        }
        throw new Error(`no pipe found for ${entityName}.`);
    }
}

export const PIPE_CONTEXT_PROVIDER = new PipeContextProvider();
export default PIPE_CONTEXT_PROVIDER;
