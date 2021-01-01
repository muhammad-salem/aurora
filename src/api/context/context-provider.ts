export type ContextDescriptorRef = { [key: string]: any };

export interface ContextProvider<T extends ContextDescriptorRef> {
    hasProvider(entityName: string): boolean;
    getProvider(entityName: string): ContextDescriptorRef;
}

export function isContextProvider<T>(obj: any): obj is ContextProvider<T> {
    return Reflect.has(obj, 'context')
        && Reflect.has(obj.__proto__, 'hasProvider')
        && Reflect.has(obj.__proto__, 'getProvider');
}

export class ContextProviderImpl<T extends ContextDescriptorRef> implements ContextProvider<T>{
    constructor(public context: T) { }
    hasProvider(entityName: string): boolean {
        return Reflect.has(this.context, entityName) || Reflect.has(this.context.__proto__, entityName);
    }
    getProvider(entityName: string): ContextDescriptorRef {
        return this.context[entityName];
    }
}

export type ContextStack<T> = Array<ContextProvider<T>> & { findContext(entityName: string): ContextProvider<T> | undefined; };

export class ContextStackImpl<T extends ContextDescriptorRef> extends Array<ContextProvider<T>> implements ContextStack<T> {

    findContext(entityName: string): ContextProvider<ContextDescriptorRef> | undefined {
        return this.find(context => {
            return context.hasProvider(entityName);
        });
    }

}

export function createContextStack<T extends ContextDescriptorRef>(...providers: T[]): ContextStack<T> {
    const stack = new ContextStackImpl(providers.length);
    providers.forEach(provider => stack.push(new ContextProviderImpl(provider)));
    return stack;
}

export function getContext(provider: ContextDescriptorRef | ContextProvider<ContextDescriptorRef>): ContextProvider<ContextDescriptorRef> {
    if (isContextProvider(provider)) {
        return provider;
    } else {
        return new ContextProviderImpl(provider);
    }
}

export function mergeContextProviders<T extends ContextDescriptorRef>(...providers: (T | ContextProvider<T>)[]): ContextStack<T> {
    const stack = new ContextStackImpl(providers.length);
    providers.forEach(provider => stack.push(getContext(provider)));
    return stack;
}
