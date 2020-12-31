export type ContextDescriptorRef = { [key: string]: any };

export interface ContextProvider<T> {
    next?: ContextProvider<any>;
    getContext(entityName: string): ContextProvider<any> | undefined;
    getProvider(entityName: string): {} | undefined;
}

export function isContextProvider<T>(obj: any): obj is ContextProvider<T> {
    return Reflect.has(obj, 'context')
        && Reflect.has(obj.__proto__, 'getContext')
        && Reflect.has(obj.__proto__, 'getProvider');
}

export class ContextProviderImpl<T extends ContextDescriptorRef> implements ContextProvider<T>{
    constructor(public context: T, public next?: ContextProvider<any>) { }
    getContext(entityName: string): ContextProvider<any> | undefined {
        if (entityName in this.context) {
            return this;
        }
        if (this.next) {
            return this.next.getContext(entityName);
        }
        return undefined;
    }
    getProvider(entityName: string): {} | undefined {
        if (entityName in this.context) {
            return this.context[entityName];
        }
        if (this.next) {
            const searchForNextContext = this.next.getContext(entityName);
            if (searchForNextContext) {
                return searchForNextContext.getProvider(entityName);
            }
        }
        return undefined;
    }
}

export function createContextProviders<T>(...providers: ContextDescriptorRef[]): ContextProvider<T> {
    if (!providers || providers.length === 0) {
        return new ContextProviderImpl(window);
    }
    let lastContext = new ContextProviderImpl(providers[0]);
    for (let i = 1; i < providers.length; i++) {
        const element = providers[i];
        lastContext = new ContextProviderImpl(element, lastContext);
    }
    return lastContext;
}

export function appendContextProviders(lastContext: ContextProvider<ContextDescriptorRef>, ...providers: ContextDescriptorRef[]): ContextProvider<ContextDescriptorRef> {
    for (let i = 0; i < providers.length; i++) {
        const element = providers[i];
        lastContext = new ContextProviderImpl(element, lastContext);
    }
    return lastContext;
}

export function getContext(provider: ContextDescriptorRef | ContextProvider<ContextDescriptorRef>, next?: ContextProvider<ContextDescriptorRef>): ContextProvider<ContextDescriptorRef> {
    if (isContextProvider(provider)) {
        if (next) {
            provider.next = next;
        }
        return provider;
    } else {
        return new ContextProviderImpl(provider, next);
    }
}

export function mergeContextProviders(...providers: (ContextDescriptorRef | ContextProvider<ContextDescriptorRef>)[]): ContextProvider<ContextDescriptorRef> {
    if (!providers || providers.length === 0) {
        return new ContextProviderImpl(window);
    }
    let lastContext = getContext(providers[0]);
    for (let i = 1; i < providers.length; i++) {
        lastContext = getContext(providers[i], lastContext);
    }
    return lastContext;
}
