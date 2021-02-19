
export function findByModelClassOrCreat<T = any>(modelProperty: Object): T {
	var bootstrapMetadata: T = Reflect.get(modelProperty, 'bootstrap');
	if (!bootstrapMetadata) {
		bootstrapMetadata = {} as T;
		Object.defineProperty(modelProperty, 'bootstrap', { value: bootstrapMetadata });
	}
	return bootstrapMetadata;
}

export function setBootstrapTagNameMetadata(modelProperty: Object, bootstrapTagName: string, metadata: Object) {
	Reflect.set(modelProperty, bootstrapTagName, metadata);
}

export function getBootstrapMetadata<T = any>(modelProperty: Object): T {
	return Reflect.get(modelProperty, 'bootstrap');
}

export function getBootstrapTagNameMetadata<T = any>(modelProperty: Object, bootstrapTagName: string): T {
	return Reflect.get(modelProperty, bootstrapTagName);
}
