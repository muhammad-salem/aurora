import { NodeExpression } from '@ibyar/expressions';

export type ContextDescriptorRef = { [key: string]: any };

export interface ContextProvider<T extends ContextDescriptorRef> {
	getContext(entityName: string): T | undefined;
	hasContext(entityName: string): boolean;
	getContextValue(entityName: string): any;
	setContextValue(entityName: string, value: any): boolean;
}

export function isContextProvider<T>(obj: any): obj is ContextProvider<T> {
	return Reflect.has(Object.getPrototypeOf(obj), 'getContext')
		&& Reflect.has(Object.getPrototypeOf(obj), 'hasContext')
		&& Reflect.has(Object.getPrototypeOf(obj), 'getContextValue')
		&& Reflect.has(Object.getPrototypeOf(obj), 'setContextValue');
}

export class ContextProviderImpl<T extends ContextDescriptorRef> implements ContextProvider<T>{
	constructor(public context: T) { }
	getContext(entityName?: string): T {
		return this.context;
	}
	hasContext(entityName: string): boolean {
		return entityName in this.context;
	}
	getContextValue(entityName: string): any {
		return Reflect.get(this.context, entityName);
	}
	setContextValue(entityName: string, value: any): boolean {
		return Reflect.set(this.context, entityName, value);
	}
}

export type ContextStack<T> = Array<ContextProvider<T>> & {
	/**
	 * search providers for by entity name,
	 * if can't found the stack should return the first provider
	 * @param entityName 
	 */
	findContextProvider(entityName: string): ContextProvider<T>;
};

export interface PropertyMap {
	entityName: string;
	provider: ContextProvider<ContextDescriptorRef>;
}

export interface TemplatePropertyMap {
	template: string;
	propertyMap: PropertyMap[];
	expression: NodeExpression;
	context: object;
}

/**
 * An implementation of ContextStack
 */
export class ContextStackImpl<T extends ContextDescriptorRef> extends Array<ContextProvider<T>> implements ContextStack<T> {

	findContextProvider(entityName: string): ContextProvider<T> {
		return this.find(context => context.hasContext(entityName)) || this[0];
	}

}

export function createContextStack<T extends ContextDescriptorRef>(...providers: T[]): ContextStack<T> {
	const length = providers.length;
	const stack = new ContextStackImpl<T>(length);
	for (let i = 0; i < length; i++) {
		stack[length - i - 1] = new ContextProviderImpl(providers[i]);
	}
	return stack;
}

export function getContext<T extends ContextDescriptorRef>(provider: T | ContextProvider<T>): ContextProvider<T> {
	if (isContextProvider(provider)) {
		return provider;
	} else {
		return new ContextProviderImpl(provider);
	}
}

export function mergeContextProviders<T extends ContextDescriptorRef>(...providers: (T | ContextProvider<T>)[]): ContextStack<T> {
	const length = providers.length;
	const stack = new ContextStackImpl<T>(length);
	for (let i = 0; i < length; i++) {
		stack[length - i - 1] = getContext(providers[i]);
	}
	return stack;
}

export function mergeContextStack<T extends ContextDescriptorRef>(contextStack: ContextStack<T>, provider: T | ContextProvider<T>): ContextStack<T> {
	const stack = new ContextStackImpl(getContext(provider), ...contextStack);
	return stack;
}
