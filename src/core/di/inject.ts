import { TypeOf } from '../utils/typeof.js';

const instances = new WeakMap<TypeOf<any>, any>();

export function inject<T>(type: TypeOf<T>) {
	if (instances.has(type)) {
		return instances.get(type);
	}
	const ref = new type();
	instances.set(type, ref);
	return ref;
}
