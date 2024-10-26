import { AbstractType, Type } from '../utils/typeof.js';
import { InjectionProvider, InjectionToken, Provider } from './provider.js';


const ROOT_PROVIDER = new InjectionProvider();

const providers: InjectionProvider[] = [];

export function forkProvider(): InjectionProvider {
	return ROOT_PROVIDER.fork();
}

export function addProvider(modelProvider: InjectionProvider) {
	providers.push(modelProvider);
}

export function removeProvider(modelProvider: InjectionProvider) {
	const index = providers.findIndex(provider => provider === modelProvider);
	if (index >= 0) {
		providers.splice(index, 1);
	}
}

export function provide<T>(type: Type<T>): void;
export function provide<T>(type: AbstractType<T>): void;
export function provide<T>(type: Type<T>, value: T): void;
export function provide<T>(type: AbstractType<T>, value: T): void;
export function provide<T>(token: InjectionToken<T>, value: T): void;
export function provide<T>(provider: Provider<T>, value?: T) {
	ROOT_PROVIDER.provide(provider, value);
}

export function inject<T>(type: Type<T>): T;
export function inject<T>(type: AbstractType<T>): T;
export function inject<T>(token: InjectionToken<T>): T | undefined;
export function inject<T>(provider: Provider<T>): T | undefined {
	return ROOT_PROVIDER.inject(provider);
}

export function clearInjection<T>(type: Type<T>): void;
export function clearInjection<T>(token: InjectionToken<T>): void;
export function clearInjection<T>(provider: Provider<T>) {
	ROOT_PROVIDER.clear(provider);
}
