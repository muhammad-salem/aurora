/**
 * search for an instance property names
 *  and set all the un found properties in that instance to be undefined.
 * 
 * add all notfound propertyKeys to instance definition(map).
 * @param instance 
 */
export function defineInstancePropertyMap<T extends { [key: string]: any }>(instance: T) {
	if (typeof instance !== 'object') {
		return;
	}
	const prototype = Object.getPrototypeOf(instance);
	if (!prototype) {
		return;
	}
	const keys = Reflect.getPropertyKeys(prototype);
	keys
		.filter(key => !Reflect.has(instance, key))
		.forEach(key => Reflect.set(instance, key, undefined));
}
