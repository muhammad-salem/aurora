/**
 * @module
 * https://rbuckton.github.io/reflect-metadata/
 */

export type MetadataKey = 'design:type' | 'design:paramtypes' | 'design:returntype'
	| 'selfskip' | 'optional'
	| 'input' | 'output'
	| 'view' | 'viewchild' | 'viewchildren'
	| 'hostlistener' | 'hostbinding'
	| 'component' | 'service' | 'directive' | 'pipe'
	| string;

export interface MetadataRef {
	// MetadataKey
	[key: string]: any;
	'design:type'?: any;
	'design:paramtypes'?: any;
	'design:returntype'?: any;

	selfskip?: any;
	optional?: any;

	input?: any;
	output?: any;
	view?: any;
	viewchild?: any;
	viewchildren?: any;
	hostlistener?: any;

	component?: any;
	service?: any;
	directive?: any;
	pipe?: any;
}

declare global {
	namespace Reflect {
		function defineMetadata(metadataKey: MetadataKey, metadataValue: any, target: object): void;
		function defineMetadata(metadataKey: MetadataKey, metadataValue: any, target: object, propertyKey: string): void;

		function metadata(metadataKey: MetadataKey, value: any): Function;

		function hasMetadata(metadataKey: MetadataKey, target: object): boolean;
		function hasMetadata(metadataKey: MetadataKey, target: object, propertyKey?: string): boolean;

		function getMetadata(metadataKey: void, target: object): Metadata;
		function getMetadata(metadataKey: MetadataKey, target: object): any[];
		function getMetadata(metadataKey: MetadataKey, target: object, propertyKey: string | symbol): any;

		function getPropertyKeys(target: object): string[];

		function getOwnMetadata(metadataKey: void, target: object): Metadata;
		function getOwnMetadata(metadataKey: MetadataKey, target: object): any[];
		function getOwnMetadata(metadataKey: MetadataKey, target: object, propertyKey: string): MetadataRef;

		function getMetadataKeys(target: object): MetadataKey[];
		function getMetadataKeys(target: object, propertyKey: string | symbol): MetadataKey[];

		function getOwnMetadataKeys(target: object): MetadataKey[];
		function getOwnMetadataKeys(target: object, propertyKey: string | symbol): MetadataKey[];

		function deleteMetadata(metadataKey: MetadataKey, target: object): void;
		function deleteMetadata(metadataKey: MetadataKey, target: object, propertyKey: string | symbol): void;

		function getMetadataMap(prototypeRef: Object): Metadata | undefined;
	}
}

if (!Reflect.has(Symbol, 'metadata')) {
	Reflect.set(Symbol, 'metadata', Symbol.for('metadata'));
}

const MetadataSymbol = Symbol as SymbolConstructor & { readonly metadata: unique symbol };

const PROPERTY_TYPE = Symbol.for('PROPERTY_TYPE');

export class Metadata {
	static setMetadata(prototypeRef: Object, metadata: Metadata) {
		Object.defineProperty(prototypeRef, MetadataSymbol.metadata, { value: metadata });
	}
	static createMetadata(prototypeRef: Object): Metadata {
		const metadata: Metadata = new Metadata(prototypeRef);
		Object.defineProperty(prototypeRef, MetadataSymbol.metadata, { value: metadata });
		return metadata;
	}
	static getMetadata(prototypeRef: Object): Metadata {
		return Reflect.get(prototypeRef, MetadataSymbol.metadata);
	}

	// propertyKey
	[key: string]: MetadataRef;
	'class': MetadataRef;

	[PROPERTY_TYPE]: object;

	constructor(prototypeRef: Object) {
		Metadata.setMetadata(prototypeRef, this);
		this[PROPERTY_TYPE] = prototypeRef;
	}
	setMetadata(propertyKey: string, metadataKey: MetadataKey, value: MetadataRef): void {
		this[propertyKey] = this[propertyKey] || {};
		this[propertyKey][metadataKey] = value;
	}

	getMetadata(propertyKey: string, metadataKey?: MetadataKey): MetadataRef | MetadataRef[] | string[] | any {
		if (propertyKey && metadataKey) {

			if (propertyKey in this) {
				if (metadataKey in this[propertyKey]) {
					return this[propertyKey][metadataKey];
				}
			}
		} else if (propertyKey in this) {
			return this[propertyKey];
		} else if (metadataKey) {
			return this.getOwnMetadata(metadataKey);
		} else {
			return false;
		}
	}

	getOwnMetadata(metadataKey?: MetadataKey): MetadataRef[] {
		if (metadataKey) {
			return this.propertyKeys()
				.map((key) => this[key])
				.filter((meta) => meta[metadataKey]);
		}
		return this.propertyKeys().map((key) => this[key]);
	}

	getPropertyKeyFor(metadataKey?: MetadataKey): string[] {
		if (metadataKey) {
			return this.propertyKeys()
				.map((key) => {
					return { key: key, value: this[key] };
				})
				.filter((pair) => metadataKey in pair.value)
				.map((pair) => pair.key);
		}
		return this.propertyKeys();
	}

	hasProperty(propertyKey: string): boolean {
		return this[propertyKey] ? true : false;
	}

	hasMetadata(metadataKey: MetadataKey, propertyKey?: string): boolean {
		if (metadataKey && propertyKey) {
			if (propertyKey in this) {
				return metadataKey in this[propertyKey];
			}
		} else if (metadataKey && !propertyKey) {
			for (const key of (Object.keys(this) as PropertyKey[]).concat(Object.getOwnPropertySymbols(metadata))) {
				if (metadataKey in this[key as string]) {
					return true;
				}
			}
		} else if (!metadataKey && propertyKey) {
			return propertyKey in this;
		}
		return false;
	}

	propertyKeys(): string[] {
		let parent = [];
		let target = this[PROPERTY_TYPE];
		while (target) {
			parent.push(target);
			target = Object.getPrototypeOf(target);
			target = target?.constructor.prototype;
		}
		return parent
			.map((proto) => Metadata.getMetadata(proto))
			.filter(metadata => metadata)
			.flatMap(metadata => [...Object.keys(this), ...Object.getOwnPropertySymbols(metadata)] as (string)[])
			.filter(key => (key !== PROPERTY_TYPE as any && key !== 'class'));
	}
	metadataKeys(): string[] {
		let parent = [];
		let target = this[PROPERTY_TYPE];
		while (target) {
			parent.push(target);
			target = Object.getPrototypeOf(target);
			target = target?.constructor.prototype;
		}
		return parent
			.map((proto) => Metadata.getMetadata(proto))
			.filter((metadata) => metadata)
			.flatMap((metadata) => metadata.getOwnMetadataKeys() as string[])
			.filter((elem, index, arr) => arr.indexOf(elem) === index);
	}

	getOwnMetadataKeys(propertyKey?: string): string[] | MetadataKey[] {
		if (propertyKey) {
			return Object.keys(this[propertyKey]);
		}
		return Object.keys(this)
			.filter(key => (key !== PROPERTY_TYPE.toString()))
			.map((key) => this[key])
			.flatMap((metaRef) => Object.keys(metaRef));
	}

	deleteMetadata(propertyKey: string, metadataKey?: MetadataKey): void {
		if (metadataKey) {
			delete this[propertyKey][metadataKey];
		} else {
			delete this[propertyKey];
		}
	}
}

function getMetadataOrDefineMap(target: Object): Metadata {
	let prototype = typeof target === 'function' ? target.prototype : target;
	let metadata: Metadata = Metadata.getMetadata(prototype);
	if (!metadata) {
		metadata = Metadata.createMetadata(prototype);
	}
	return metadata;
}

export function defineMetadata(metadataKey: MetadataKey, metadataValue: any, target: Object, propertyKey: string): void {
	getMetadataOrDefineMap(target).setMetadata(
		propertyKey || 'class',
		metadataKey,
		metadataValue
	);
}

export function metadata(metadataKey: MetadataKey, metadataValue: any): Function {
	function decorator(target: typeof Object, propertyKey?: string) {
		getMetadataOrDefineMap(target).setMetadata(propertyKey || 'class', metadataKey, metadataValue);
	}
	return decorator;
}

export function hasMetadata(metadataKey: MetadataKey, target: object, propertyKey?: string): boolean {
	return getMetadataOrDefineMap(target).hasMetadata(metadataKey, propertyKey || 'class');
}

export function getMetadata(metadataKey: MetadataKey, target: Function, propertyKey?: string): any {
	return getMetadataOrDefineMap(target).getMetadata(propertyKey || 'class', metadataKey);
}

export function getOwnMetadata(target: object, propertyKey: string): string[] | MetadataKey[] {
	return getMetadataOrDefineMap(target).getOwnMetadataKeys(propertyKey || 'class');
}

export function getPropertyKeys(target: object): string[] {
	return getMetadataOrDefineMap(target).propertyKeys();
}

export function getMetadataKeys(target: object, propertyKey?: string): string[] {
	return getMetadataOrDefineMap(target).metadataKeys();
}

Object.defineProperty(Reflect, 'defineMetadata', { value: defineMetadata });
Object.defineProperty(Reflect, 'metadata', { value: metadata });
Object.defineProperty(Reflect, 'hasMetadata', { value: hasMetadata });
Object.defineProperty(Reflect, 'getMetadata', { value: getMetadata });
Object.defineProperty(Reflect, 'getOwnMetadata', { value: getOwnMetadata });
Object.defineProperty(Reflect, 'getPropertyKeys', { value: getPropertyKeys });
Object.defineProperty(Reflect, 'getMetadataKeys', { value: getMetadataKeys });
Object.defineProperty(Reflect, 'getMetadataMap', { value: Metadata.getMetadata });
