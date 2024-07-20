import type ts from 'typescript/lib/tsserverlibrary.js';

export type ViewInfo = {
	selector: string;
	extendsType: string;
	viewName: string;
	interFaceType: ts.InterfaceDeclaration;
	formAssociated: boolean;
};

export type DecoratorInfo = { name: string, aliasName: string, type?: string };

export type ClassInfo = {
	type: 'component' | 'directive';
	name: string,
	successor?: string;
	views: ViewInfo[];
	inputs: DecoratorInfo[];
	outputs: DecoratorInfo[];
};

export type ModuleInfo = { path: string; classes?: ClassInfo[]; }

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
		if (info.classes?.length) {
			const old = this.map.get(info.path);
			if (old) {
				info.classes = info.classes.concat(old.classes ?? []);
			}
		}
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
