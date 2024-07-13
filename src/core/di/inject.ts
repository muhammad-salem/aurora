import { TypeOf } from '../utils/typeof.js';

export class InjectionToken<T> {
	constructor(public token: string) { }
}

type Provider<T> = TypeOf<T> | InjectionToken<T>;

const instances = new WeakMap<Provider<any>, any>();

export function inject<T>(type: TypeOf<T>): T;
export function inject<T>(type: InjectionToken<T>): T | undefined;
export function inject<T>(type: Provider<T>): T | undefined {
	if (instances.has(type) || type instanceof InjectionToken) {
		return instances.get(type);
	}
	const ref = new type();
	instances.set(type, ref);
	return ref;
}

export function provide<T>(provider: Provider<T>, value: T) {
	instances.set(provider, value);
}
