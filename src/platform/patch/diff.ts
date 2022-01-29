export type TrackBy<T, R = T> = (index: number, item: T) => R;
export type DiffOptions<T, R = T> = { trackBy?: TrackBy<T, R> };

export enum PatchOperation {
	ADD = 'add',
	REMOVE = 'remove',
	REPLACE = 'replace',
	MOVE = 'move',
	KEEP = 'keep'
};

export type PatchArray = { currentIndex: number, nextIndex: number, op: PatchOperation };
export type PatchObject = { key: string, op: PatchOperation };
export const PatchRoot = { op: PatchOperation.REPLACE, root: true };
export type DiffPatch = PatchArray | PatchObject;

export class JSONPatch {

	protected diffArray<T, R = T>(input: T[], output: T[], options?: DiffOptions<T, R>): PatchArray[] | [typeof PatchRoot] {
		type DiffArray = Omit<PatchArray, 'op'> & { ignore?: boolean, op: PatchOperation };
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
			});
		});
		identityOutput.forEach((item, index) => {
			const oldIndex = identityInput.indexOf(item as T & R);
			if (oldIndex == -1) {
				diffArray.push({
					currentIndex: -1,
					nextIndex: index,
					op: PatchOperation.ADD,
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
		console.log([...removed, ...apply]);
		return removed.concat(apply) as PatchArray[];
	}

	protected diffObject<T = any>(input: T, output: T): PatchObject[] | [typeof PatchRoot] {
		return [];
	}

	diff<T = any>(input: T, output: T): PatchObject[] | [typeof PatchRoot];
	diff<T>(input: T[], output: T[]): PatchArray[] | [typeof PatchRoot];
	diff<T, R>(input: T[], output: T[], options?: DiffOptions<T, R>): PatchArray[] | [typeof PatchRoot];
	diff(input: any, output: any, options?: DiffOptions<any, any>): DiffPatch[] | [typeof PatchRoot] {
		if (Array.isArray(input) && Array.isArray(output)) {
			return this.diffArray(input, output, options);
		} else if (typeof input == 'object' && typeof output == 'object') {
			return this.diffObject(input, output);
		}
		return [PatchRoot];
	}
}

const jsonPatch = new JSONPatch();

export const diff = jsonPatch.diff.bind(jsonPatch);
