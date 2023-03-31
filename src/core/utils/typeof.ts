/**
 * send the class itself, not instance
 */
export interface TypeOf<T> extends Function {
	new(...values: any): T;
	[key: PropertyKey]: any;
}

export type Class<T = any> = new (...args: any) => T;

export type MetadataClass<T = any> = Class<T> & { [Symbol.metadata]: Record<PropertyKey, any> };
