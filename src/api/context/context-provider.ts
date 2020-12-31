

export type ContextDescriptorRef = { [key: string]: any };

export class ContextProvider<T extends ContextDescriptorRef> {
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

function isContextProvider<T>(obj: any): obj is ContextProvider<T> {
    return Reflect.has(obj, 'context')
        && Reflect.has(obj.__proto__, 'getContext')
        && Reflect.has(obj.__proto__, 'getProvider');
}

export function createContextProviders(...providers: ContextDescriptorRef[]): ContextProvider<ContextDescriptorRef> {
    if (!providers || providers.length === 0) {
        return new ContextProvider(window);
    }
    let lastContext = new ContextProvider(providers[0]);
    for (let i = 1; i < providers.length; i++) {
        const element = providers[i];
        lastContext = new ContextProvider(element, lastContext);
    }
    return lastContext;
}

export function appendContextProviders(lastContext: ContextProvider<ContextDescriptorRef>, ...providers: ContextDescriptorRef[]): ContextProvider<ContextDescriptorRef> {
    for (let i = 0; i < providers.length; i++) {
        const element = providers[i];
        lastContext = new ContextProvider(element, lastContext);
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
        return new ContextProvider(provider, next);
    }
}

export function mergeContextProviders(...providers: (ContextDescriptorRef | ContextProvider<ContextDescriptorRef>)[]): ContextProvider<ContextDescriptorRef> {
    if (!providers || providers.length === 0) {
        return new ContextProvider(window);
    }
    let lastContext = getContext(providers[0]);
    for (let i = 1; i < providers.length; i++) {
        lastContext = getContext(providers[i], lastContext);
    }
    return lastContext;
}

