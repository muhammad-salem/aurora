export type MetadataClass<T = any> = { new(...args: any): T;[Symbol.metadata]: Record<PropertyKey, any> };

export interface MetadataContext extends Record<PropertyKey, any> {

}

declare global {

	interface SymbolConstructor {
		/**
		 * metadata symbol
		 */
		readonly metadata: unique symbol;
	}
}

if (!Symbol.metadata) {
	Object.defineProperty(Symbol, 'metadata', {
		configurable: false,
		enumerable: false,
		writable: false,
		value: Symbol('Symbol.metadata'),
	});
}

export function makeClassDecorator<V, Type = any>(
	decorator?: (param: V, constructor: Type, context: ClassDecoratorContext<new (...args: any) => any>) => void) {
	return (param: V) => {
		return (constructor: any, context: ClassDecoratorContext<new (...args: any) => any>) => {
			decorator?.(param, constructor, context);
			return constructor;
		};
	};
}

export const Metadata = makeClassDecorator<void>();

export function makeClassMemberDecorator<Value, Context extends ClassMemberDecoratorContext = ClassMemberDecoratorContext>(decorator?: (value: Value | undefined, context: Context) => void) {
	return (value: Value, context: Context) => {
		decorator?.(value, context);
	};
}
