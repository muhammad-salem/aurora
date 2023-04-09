import type ts from 'typescript/lib/tsserverlibrary.js';

export type ViewInfo = {
	selector: string;
	extendsType: string;
	viewName: string;
	interFaceType: ts.InterfaceDeclaration;
	formAssociated: boolean;
};

export type InputOutputTypeInfo = { [name: string]: string | undefined };

export type ClassInfo = {
	name: string,
	views: ViewInfo[];
	inputs: InputOutputTypeInfo;
	outputs: InputOutputTypeInfo;
};

export type ModuleInfo =
	| { path: string; skip: true; }
	| { path: string; skip?: false; classes?: ClassInfo[]; }

class ModuleManger implements Map<string, ModuleInfo> {
	[Symbol.iterator](): IterableIterator<[string, ModuleInfo]> {
		return this.map[Symbol.iterator]();
	}
	[Symbol.toStringTag]: string = 'Module Info';

	get size(): number {
		return this.map.size;
	}

	private map = new Map<string, ModuleInfo>();

	add(info: ModuleInfo) {
		this.map.set(info.path, info);
	}
	clear(): void {
		this.map.clear();
	}
	delete(key: string): boolean {
		return this.map.delete(key);
	}
	forEach(callbackfn: (value: ModuleInfo, key: string, map: Map<string, ModuleInfo>) => void, thisArg?: any): void {
		this.map.forEach(callbackfn, thisArg);
	}
	get(key: string): ModuleInfo | undefined {
		return this.map.get(key);
	}
	has(key: string): boolean {
		return this.map.has(key);
	}
	set(key: string, value: ModuleInfo): this {
		this.map.set(key, value);
		return this;
	}
	entries(): IterableIterator<[string, ModuleInfo]> {
		return this.map.entries();
	}
	keys(): IterableIterator<string> {
		return this.map.keys();
	}
	values(): IterableIterator<ModuleInfo> {
		return this.map.values();
	}
}

export const moduleManger = new ModuleManger();
