export type TrackBy<T, R = T> = (index: number, item: T) => R;
export type DiffOptions<T, R = T> = { trackBy?: TrackBy<T, R> };

export enum PatchOperation {
	ADD = 'add',
	REMOVE = 'remove',
	REPLACE = 'replace',
	MOVE = 'move',
	KEEP = 'keep'
};

export type PatchArray<T> = { currentIndex: number, nextIndex: number, op: PatchOperation, item: T };
export type PatchObject = { key: string, op: PatchOperation };
export type PatchReplaceRoot = { op: PatchOperation.REPLACE, root: true };
export type DiffPatch<T> = PatchArray<T> | PatchObject;

export class JSONPatch {

	protected diffArray<T, R = T>(input: T[], output: T[], options?: DiffOptions<T, R>): PatchArray<T>[] | [PatchReplaceRoot] {
		type DiffArray = PatchArray<T> & { ignore?: boolean };
		const trackBy = options?.trackBy;
		const identityInput = (trackBy && input.map((item, index) => trackBy(index, item))) ?? input;
		const identityOutput = (trackBy && output.map((item, index) => trackBy(index, item))) ?? output;
		const diffArray: DiffArray[] = [];
		identityInput.forEach((item, index) => {
			const nextIndex = identityOutput.indexOf(item as T & R);
			const op: PatchOperation = nextIndex == -1
				? PatchOperation.REMOVE
				: index == nextIndex
					? PatchOperation.KEEP
					: PatchOperation.MOVE;
			diffArray.push({
				currentIndex: index,
				nextIndex: nextIndex,
				op: op,
				item: output[nextIndex]
			});
		});
		identityOutput.forEach((item, index) => {
			const oldIndex = identityInput.indexOf(item as T & R);
			if (oldIndex == -1) {
				diffArray.push({
					currentIndex: -1,
					nextIndex: index,
					op: PatchOperation.ADD,
					item: output[index]
				});
			}
		});
		const patchArray: DiffArray[] = new Array<DiffArray>(output.length);
		let i = 0;
		diffArray.forEach(item => {
			if (item.ignore) {
				return;
			}
			let patch = item;
			if (PatchOperation.REMOVE == item.op) {
				const replacedItem = diffArray.find(r => !r.ignore && r.nextIndex == item.currentIndex);
				if (replacedItem) {
					if (PatchOperation.MOVE == replacedItem.op) {
						item.ignore = replacedItem.ignore = true;
						return;
					} else {
						replacedItem.ignore = true;
						patch = {
							currentIndex: item.currentIndex,
							nextIndex: replacedItem.nextIndex,
							op: PatchOperation.REPLACE,
							item: replacedItem.item
						};
					}
				}
			}
			patchArray[i++] = patch;
		});
		const removed = patchArray
			.filter(item => !item.ignore && PatchOperation.REMOVE == item.op)
			.sort((a, b) => b.currentIndex - a.currentIndex);
		const apply = patchArray
			.filter(item => !item.ignore && PatchOperation.REMOVE != item.op)
			.sort((a, b) => a.nextIndex - b.nextIndex);
		return removed.concat(apply) as PatchArray<T>[];
	}

	protected diffObject<T = any>(input: T, output: T): PatchObject[] | [PatchReplaceRoot] {
		return [];
	}

	diff<T = any>(input: T, output: T): PatchObject[] | [PatchReplaceRoot];
	diff<T>(input: T[], output: T[]): PatchArray<T>[] | [PatchReplaceRoot];
	diff<T, R>(input: T[], output: T[], options?: DiffOptions<T, R>): PatchArray<T>[] | [PatchReplaceRoot];
	diff(input: any, output: any, options?: DiffOptions<any, any>): DiffPatch<any>[] | [PatchReplaceRoot] {
		if (Array.isArray(input) && Array.isArray(output)) {
			return this.diffArray(input, output, options);
		} else if (typeof input == 'object' && typeof output == 'object') {
			return this.diffObject(input, output);
		}
		return [{ op: PatchOperation.REPLACE, root: true }];
	}
}

const jsonPatch = new JSONPatch();

export function diff<T = any>(input: T, output: T): PatchObject[] | [PatchReplaceRoot];
export function diff<T>(input: T[], output: T[]): PatchArray<T>[] | [PatchReplaceRoot];
export function diff<T, R>(input: T[], output: T[], options?: DiffOptions<T, R>): PatchArray<T>[] | [PatchReplaceRoot];
export function diff(input: any, output: any, options?: DiffOptions<any, any>): DiffPatch<any>[] | [PatchReplaceRoot] {
	return jsonPatch.diff(input, output, options);
}

export function isPatchReplaceRoot(patch: any): patch is PatchReplaceRoot {
	let test: any = patch;
	if (Array.isArray(patch)) {
		test = patch[0];
	}
	return typeof test === 'object' && test.op === PatchOperation.REPLACE && test.root === true;
}
