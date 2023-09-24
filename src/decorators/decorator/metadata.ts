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


class ContextService {
	constructor(private contextMap: WeakMap<Record<any, any>, Record<any, any>>) { }

	has(key: Record<any, any>) {
		return this.contextMap.has(key);
	}

	get(key: Record<any, any>) {
		return this.contextMap.get(key);
	}

	getOrCreate(key: Record<any, any>) {
		if (this.contextMap.has(key)) {
			return this.contextMap.get(key);
		}
		const value = Object.create(null);
		const prototype = Object.getPrototypeOf(key);
		if (this.contextMap.has(prototype)) {
			const parent = this.contextMap.get(prototype);
			parent && this.clone(value, parent);
		}
		this.contextMap.set(key, value);
		return value;
	}

	private clone(child: MetadataContext, parent: MetadataContext): void {
		for (const property in parent) {
			const parentValue = parent[property];
			if (Array.isArray(parentValue)) {
				child[property] = [...parentValue];
			} else if (typeof parentValue === 'undefined' || parentValue === null) {
				child[property] = parentValue;
			} else if (typeof parentValue === 'object') {
				child[property] = Object.assign(Object.create(null), parentValue);
			} else {
				child[property] = parentValue;
			}
		}
	}
}

const contextMap = new WeakMap<Record<any, any>, Record<any, any>>();
export const metadataHoler = new ContextService(contextMap);


export function makeClassDecorator<V, Type = any>(
	decorator?: (param: V, constructor: Type, context: ClassDecoratorContext<new (...args: any) => any>, metadata: MetadataContext) => void
) {
	return (param: V) => {
		return (constructor: any, context: ClassDecoratorContext<new (...args: any) => any>) => {
			const metadata = metadataHoler.getOrCreate(context.metadata);
			decorator?.(param, constructor, context, metadata);
			return constructor;
		};
	};
}

export const Metadata = makeClassDecorator<void>();

export function makeClassMemberDecorator<Value, Context extends ClassMemberDecoratorContext = ClassMemberDecoratorContext>(
	decorator?: (value: Value | undefined, context: Context, metadata: MetadataContext) => void
) {
	return (value: Value, context: Context) => {
		const metadata = metadataHoler.getOrCreate(context.metadata);
		decorator?.(value, context, metadata);
	};
}
