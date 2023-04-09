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
	Object.defineProperty(Symbol, 'metadata', {
		configurable: false,
		enumerable: false,
		writable: false,
		value: Symbol('metadata'),
	});
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

	static merge(previous: MetadataContext, next: MetadataContext): MetadataContext {
		for (const key in next) {
			const previousValue = previous[key];
			const nextValue = next[key];
			if (typeof previousValue === 'object' && typeof nextValue === 'object') {
				if (Array.isArray(previousValue) && Array.isArray(nextValue)) {
					previous[key] = previousValue.concat(nextValue)
						.filter((value, index, array) => index === array.indexOf(value));
				} else {
					previous[key] = Object.assign(previousValue, nextValue);
				}
			} else {
				previous[key] = nextValue;
			}
		}
		return previous;
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
		if (!constructor.hasOwnProperty(Symbol.metadata)) {
			constructor[Symbol.metadata] = MetadataContext.inherits(pConstr);
		}
		MetadataContext.merge(constructor[Symbol.metadata], getCurrentMetadata());
	} else {
		if (constructor[Symbol.metadata]) {
			MetadataContext.merge(constructor[Symbol.metadata], getCurrentMetadata());
		} else {
			constructor[Symbol.metadata] = getCurrentMetadata();
		}
	}
	return constructor[Symbol.metadata];
}

export function makeClassDecorator<V, Type = any>(
	decorator?: (param: V, constructor: Type, context: ClassDecoratorContext<new (...args: any) => any>) => void) {
	return (param: V) => {
		updateCurrentMetadata();
		return (constructor: any, context: ClassDecoratorContext<new (...args: any) => any>) => {
			if (typeof context.metadata !== 'object') {
				context.metadata = updateConstructorMetadata(constructor as any as MetadataClass);
				context.addInitializer(() => {
					updateCurrentMetadata();
				});
			}
			decorator?.(param, constructor, context);
			return constructor;
		};
	};
}

export const Metadata = makeClassDecorator<void>();

export function makeClassMemberDecorator<Value, Context extends ClassMemberDecoratorContext = ClassMemberDecoratorContext>(decorator?: (value: Value | undefined, context: Context) => void) {
	return (value: Value, context: Context) => {
		if (typeof context.metadata !== 'object') {
			context.metadata = getCurrentMetadata();
		}
		decorator?.(value, context);
	};
}
