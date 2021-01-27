/**
 * send the class itself, not instance
 */
export interface TypeOf<T> extends Function {
    new(...values: any): T;
}
