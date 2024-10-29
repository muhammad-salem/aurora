import type ts from 'typescript/lib/tsserverlibrary.js';
import { SignalKey } from './signals.js';

export type ViewInfo = {
	selector: string;
	extendsType: string;
	viewName: string;
	interfaceType: ts.InterfaceDeclaration;
	formAssociated: boolean;
	disabledFeatures?: string[];
};

export type DecoratorInfo = { name: string, aliasName: string, type?: string };
export type SignalInfo = DecoratorInfo & { necessity?: 'required'; };
export type SignalMetadata = Partial<Record<SignalKey, SignalInfo[]>>;

export type ClassInfo = {
	type: 'component' | 'directive';
	name: string,
	successors?: string[];
	views: ViewInfo[];
	inputs: DecoratorInfo[];
	outputs: DecoratorInfo[];
	signals: SignalMetadata;
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
