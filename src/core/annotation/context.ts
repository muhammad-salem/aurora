import type { Class, MetadataClass } from '../utils/typeof.js';

declare global {

	interface SymbolConstructor {
		/**
		 * metadata symbol
		 */
		readonly metadata: unique symbol;
	}

	interface ClassDecoratorContext<Class extends abstract new (...args: any) => any = abstract new (...args: any) => any,> {
		context: MetadataContext;
	}

}

if (!Symbol.metadata) {
	Reflect.set(Symbol, 'metadata', Symbol('metadata'));
}

export interface MetadataContext extends Record<PropertyKey, any> {

}

export class MetadataContext {

	static create(): MetadataContext {
		return new MetadataContext();
	}

	static inherits(context: MetadataContext): MetadataContext {
		return Object.assign(MetadataContext.create(), context);
	}

}

let lastContext: MetadataContext = MetadataContext.create();

export function getCurrentMetadata(): MetadataContext {
	return lastContext;
}

export function updateCurrentMetadata(): void {
	lastContext = MetadataContext.create();
}

function setConstructorMetadata(constructor: MetadataClass, metadata: MetadataContext) {
	constructor[Symbol.metadata] = Object.assign(metadata, constructor[Symbol.metadata] ?? {});
}

export function makeMetadataDecorator<V, T extends Class = Class>(
	decorator?: (opt: V, constructor: T, context?: ClassDecoratorContext<T>) => (T | void)) {
	return (props: V): ((constructor: T, context: ClassDecoratorContext<T>) => T) => {
		const metadata: MetadataContext = MetadataContext.create();
		lastContext = metadata;
		return (constructor: T, context: ClassDecoratorContext<T>) => {
			setConstructorMetadata(constructor as any as MetadataClass, metadata);
			context.context = metadata;
			return decorator?.(props, constructor, context) ?? constructor;
		};
	}
}

export const Metadata = makeMetadataDecorator<void>();

export function MetadataScopEnd<T extends Class>() {
	const metadata = lastContext;
	updateCurrentMetadata();
	return (constructor: T, context?: ClassDecoratorContext<T>) => constructor;
}
