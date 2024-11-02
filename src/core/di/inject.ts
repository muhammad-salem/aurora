import { AbstractType, Type } from '../utils/typeof.js';
import { InjectionProvider, InjectionToken, Provider } from './provider.js';


const ROOT_PROVIDER = new InjectionProvider();

const PROVIDERS: InjectionProvider[] = [ROOT_PROVIDER];

export function forkProvider(): InjectionProvider {
	return ROOT_PROVIDER.fork();
}

export function addProvider(modelProvider: InjectionProvider) {
	PROVIDERS.push(modelProvider);
}

export function removeProvider(modelProvider: InjectionProvider) {
	const index = PROVIDERS.findIndex(provider => provider === modelProvider);
	if (index >= 0) {
		PROVIDERS.splice(index, 1);
	}
}

function getProvider(): InjectionProvider {
	return PROVIDERS.at(-1) ?? ROOT_PROVIDER;
}

export function provide<T>(type: Type<T>): void;
export function provide<T>(type: AbstractType<T>): void;
export function provide<T>(type: Type<T>, value: T): void;
export function provide<T>(type: AbstractType<T>, value: T): void;
export function provide<T>(token: InjectionToken<T>, value: T): void;
export function provide<T>(provider: Provider<T>, value?: T) {
	getProvider().provide(provider, value);
}

export function inject<T>(type: Type<T>): T;
export function inject<T>(type: AbstractType<T>): T;
export function inject<T>(token: InjectionToken<T>): T | undefined;
export function inject<T>(provider: Provider<T>): T | undefined {
	return getProvider().inject(provider);
}
