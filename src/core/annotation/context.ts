import type { Class, MetadataClass } from '../utils/typeof.js';

export interface MetadataContext extends Record<PropertyKey, any> {

}

declare global {

	interface SymbolConstructor {
		/**
		 * metadata symbol
		 */
		readonly metadata: unique symbol;
	}

	interface ClassDecoratorContext<Class extends abstract new (...args: any) => any = abstract new (...args: any) => any,> {
		metadata: MetadataContext;
	}

	interface ClassMethodDecoratorContext {
		metadata: MetadataContext;
	}

	interface ClassGetterDecoratorContext {
		metadata: MetadataContext;
	}

	interface ClassFieldDecoratorContext {
		metadata: MetadataContext;
	}

	interface ClassSetterDecoratorContext {
		metadata: MetadataContext;
	}

	interface ClassAccessorDecoratorContext {
		metadata: MetadataContext;
	}
}

if (!Symbol.metadata) {
	Reflect.set(Symbol, 'metadata', Symbol('metadata'));
}

export class MetadataContext {

	static create(): MetadataContext {
		return new MetadataContext();
	}

	static inherits(context: MetadataContext): MetadataContext {
		return Object.assign(MetadataContext.create(), context);
	}

}

let currentContext: MetadataContext = MetadataContext.create();

export function getCurrentMetadata(): MetadataContext {
	return currentContext;
}

export function updateCurrentMetadata(context?: MetadataContext): void {
	currentContext = context ?? MetadataContext.create();
}

function updateConstructorMetadata(constructor: MetadataClass, metadata: MetadataContext) {
	constructor[Symbol.metadata] = Object.assign(metadata, constructor[Symbol.metadata] ?? {});
}

export function makeClassDecoratorContext<V, T extends Class = Class>(
	decorator?: (opt: V, constructor: T, context: ClassDecoratorContext<T>) => (T | void)) {
	return (props: V): ((constructor: T, context: ClassDecoratorContext<T>) => T) => {
		updateCurrentMetadata();
		const metadata = getCurrentMetadata();
		return (constructor: T, context: ClassDecoratorContext<T>) => {
			updateConstructorMetadata(constructor as any as MetadataClass, metadata);
			context.metadata = metadata;
			const returnValue = decorator?.(props, constructor, context) ?? constructor;
			updateCurrentMetadata();
			return returnValue;
		};
	}
}

export const Metadata = makeClassDecoratorContext<void>();

export function MetadataScopEnd<T extends Class>() {
	updateCurrentMetadata();
	return (constructor: T, context?: ClassDecoratorContext<T>) => constructor;
}

export function makeClassMemberDecoratorContext<This, Value, Context extends ClassMemberDecoratorContext = ClassMemberDecoratorContext>(decorator?: (value: Value | undefined, context: Context) => void) {
	return (value: Value, context: Context) => {
		context.metadata = getCurrentMetadata();
		decorator?.(value, context);
	};
}
