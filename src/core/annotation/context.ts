
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

export function Metadata<This extends { [Symbol.metadata]: MetadataContext }, Value>(value: undefined, context: ClassFieldDecoratorContext<This, Value>) {
	if (typeof context.name !== 'symbol') {
		throw new TypeError(`type ${typeof context.name} of '${context.name.toString()}' is not supported`);
	}
	if (context.private) {
		throw new SyntaxError(`private members '${context.name.toString()}' is not supported.`);
	}
	if (!context.static) {
		throw new SyntaxError(`metadata decorator should be on static member, current property is '${context.name.toString()}'.`);
	}
	context.addInitializer(function () {
		const metadata: MetadataContext = this[Symbol.metadata]
			? MetadataContext.create()
			: MetadataContext.inherits(this[Symbol.metadata]);
		lastContext = metadata;
		return metadata;
	});
}
