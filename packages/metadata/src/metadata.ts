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

		function getPropertyKey(target: object): string[];

		function getOwnMetadata(metadataKey: void, target: object): Metadata;
		function getOwnMetadata(metadataKey: MetadataKey, target: object): any[];
		function getOwnMetadata(metadataKey: MetadataKey, target: object, propertyKey: string): MetadataRef;

		function getMetadataKeys(target: object): MetadataKey[];
		function getMetadataKeys(target: object, propertyKey: string | symbol): MetadataKey[];

		function getOwnMetadataKeys(target: object): MetadataKey[];
		function getOwnMetadataKeys(target: object, propertyKey: string | symbol): MetadataKey[];

		function deleteMetadata(metadataKey: MetadataKey, target: object): void;
		function deleteMetadata(metadataKey: MetadataKey, target: object, propertyKey: string | symbol): void;
	}
}

export class Metadata {
	static setMetadata(prototypeRef: Object, metadata: Metadata) {
		Object.defineProperty(prototypeRef, 'metadata', { value: metadata });
	}
	static createMetadata(prototypeRef: Object): Metadata {
		const metadata: Metadata = new Metadata(prototypeRef);
		Object.defineProperty(prototypeRef, 'metadata', { value: metadata });
		return metadata;
	}
	static getMetadata(prototypeRef: Object): Metadata {
		return Reflect.get(prototypeRef, 'metadata');
	}

	// propertyKey
	[key: string]: MetadataRef;
	classMetadataRef: MetadataRef;

	constructor(public prototypeRef: Object) {
		Metadata.setMetadata(prototypeRef, this);
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
			for (const key of Object.keys(this)) {
				if (key === 'prototypeRef') {
					continue;
				}
				if (metadataKey in this[key]) {
					return true;
				}
			}
		} else if (!metadataKey && propertyKey) {
			return propertyKey in this;
		}
		return false;
	}

	propertyKeys(): string[] {
		return Object.keys(this).filter((key) => key !== 'prototypeRef');
	}
	metadataKeys(): string[] {
		let parent = [];
		let target = this.prototypeRef;
		while (target) {
			parent.push(target);
			target = Object.getPrototypeOf(target);
			if (target?.constructor) {
				target = target.constructor.prototype;
			}
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
		return this.propertyKeys()
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

// Map<string, MetadataRef>
//    propaperty name: ==> {key: value}
function getMetadataMap(target: Object): Metadata {
	let prototype = typeof target === 'function' ? target.prototype : target;
	return Metadata.getMetadata(prototype);
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
		propertyKey,
		metadataKey,
		metadataValue
	);
}

export function metadata(metadataKey: MetadataKey, metadataValue: any): Function {
	function decorator(target: typeof Object, propertyKey?: string) {
		getMetadataOrDefineMap(target).setMetadata(propertyKey || 'classMetadataRef', metadataKey, metadataValue);
	}
	return decorator;
}

export function hasMetadata(metadataKey: MetadataKey, target: object, propertyKey?: string): boolean {
	return getMetadataOrDefineMap(target).hasMetadata(metadataKey, propertyKey);
}

export function getMetadata(metadataKey: MetadataKey, target: Function, propertyKey?: string): any {
	return getMetadataOrDefineMap(target).getMetadata(propertyKey || 'classMetadataRef', metadataKey);
}

export function getOwnMetadata(target: object, propertyKey: string): string[] | MetadataKey[] {
	return getMetadataOrDefineMap(target).getOwnMetadataKeys(propertyKey);
}

export function getPropertyKey(target: object): string[] {
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
Object.defineProperty(Reflect, 'getPropertyKey', { value: getPropertyKey });
Object.defineProperty(Reflect, 'getMetadataKeys', { value: getMetadataKeys });
