
const BOOTSTRAP_SYMBOL = Symbol.for('bootstrap');

export function findByModelClassOrCreat<T = any>(modelProperty: Object): T {
	var bootstrapMetadata: T = Reflect.get(modelProperty, BOOTSTRAP_SYMBOL);
	if (!bootstrapMetadata) {
		bootstrapMetadata = Object.create(null) as T;
		Reflect.set(modelProperty, BOOTSTRAP_SYMBOL, bootstrapMetadata);
	}
	return bootstrapMetadata;
}

export function setBootstrapMetadata(modelProperty: Object, metadata: Object) {
	Reflect.set(modelProperty, BOOTSTRAP_SYMBOL, metadata);
}

export function getBootstrapMetadata<T = any>(modelProperty: Object): T {
	return Reflect.get(modelProperty, BOOTSTRAP_SYMBOL);
}

export function hasBootstrapMetadata<T = any>(modelProperty: Object): boolean {
	return Reflect.has(modelProperty, BOOTSTRAP_SYMBOL);
}

export function deleteBootstrapMetadata<T = any>(modelProperty: Object): boolean {
	return Reflect.deleteProperty(modelProperty, BOOTSTRAP_SYMBOL);
}

export function getAndDeleteBootstrapMetadata<T = any>(modelProperty: Object): T {
	const bootstrap = Reflect.get(modelProperty, BOOTSTRAP_SYMBOL);
	Reflect.deleteProperty(modelProperty, BOOTSTRAP_SYMBOL);
	return bootstrap;
}
