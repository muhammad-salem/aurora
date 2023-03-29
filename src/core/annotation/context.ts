import type { Class } from '../utils/typeof.js';

declare global {
	interface SymbolConstructor {
		/**
		 * metadata symbol
		 */
		readonly metadata: unique symbol;
	}
}

if (!Symbol.metadata) {
	Reflect.set(Symbol, 'metadata', Symbol('metadata'));
}

export interface MetadataContext extends Record<PropertyKey, unknown> {

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

export function makeMetadataDecorator<V, T extends Class = Class>(
	decorator?: (opt: V, constructor: T, context?: ClassDecoratorContext<T>) => (T | void)) {
	return (props: V): ((constructor: T, context: ClassDecoratorContext<T>) => T) => {
		const metadata: MetadataContext = MetadataContext.create();
		lastContext = metadata;
		return (constructor: T, context: ClassDecoratorContext<T>) => {
			context.addInitializer(function () {
				const thisArg = this as T & { [Symbol.metadata]: MetadataContext };
				const parentMetadata = thisArg[Symbol.metadata];
				if (parentMetadata) {
					Object.assign(metadata, context);
				}
				thisArg[Symbol.metadata] = metadata;
			});
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
