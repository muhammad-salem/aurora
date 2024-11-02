/**
 * send the class itself, not instance
 */
export interface Type<T> extends Function {
	new(...values: any): T;
	[key: PropertyKey]: any;
}

export interface AbstractType<T> extends Function {
	prototype: T;
}
