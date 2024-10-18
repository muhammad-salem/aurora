/**
 * send the class itself, not instance
 */
export interface TypeOf<T> extends Function {
	new(...values: any): T;
	[key: PropertyKey]: any;
}

export type ClassType<T = any> = new (...args: any) => T;
