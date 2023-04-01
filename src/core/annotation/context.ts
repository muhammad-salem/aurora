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

	static assign(previous: MetadataContext, next: MetadataContext): MetadataContext {
		return Object.assign(previous, next);
	}

}

let currentContext: MetadataContext = MetadataContext.create();

export function getCurrentMetadata(): MetadataContext {
	return currentContext;
}

export function updateCurrentMetadata(context?: MetadataContext): void {
	currentContext = context ?? MetadataContext.create();
}

function updateConstructorMetadata(constructor: MetadataClass): MetadataContext {
	const pConstr = constructor.prototype?.constructor?.[Symbol.metadata];
	if (pConstr) {
		// inheritance
		if (constructor[Symbol.metadata] == pConstr) {
			constructor[Symbol.metadata] = MetadataContext.inherits(pConstr);
		}
		MetadataContext.assign(constructor[Symbol.metadata], getCurrentMetadata());
	} else {
		if (constructor[Symbol.metadata]) {
			MetadataContext.assign(constructor[Symbol.metadata], getCurrentMetadata());
		} else {
			constructor[Symbol.metadata] = getCurrentMetadata();
		}
	}
	return constructor[Symbol.metadata];
}

export function makeClassDecoratorContext<V, T extends Class = Class>(
	decorator?: (opt: V, constructor: T, context: ClassDecoratorContext<T>) => (T | void)) {
	return (props: V) => {
		updateCurrentMetadata();
		return (constructor: T, context: ClassDecoratorContext<T>) => {
			context.metadata = updateConstructorMetadata(constructor as any as MetadataClass);
			context.addInitializer(() => updateCurrentMetadata());
			return decorator?.(props, constructor, context) ?? constructor;
		};
	};
}

export const Metadata = makeClassDecoratorContext<void>();

export function makeClassMemberDecoratorContext<This, Value, Context extends ClassMemberDecoratorContext = ClassMemberDecoratorContext>(decorator?: (value: Value | undefined, context: Context) => void) {
	return (value: Value, context: Context) => {
		context.metadata = getCurrentMetadata();
		decorator?.(value, context);
	};
}
