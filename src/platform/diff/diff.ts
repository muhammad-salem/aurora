export type TrackBy<T, R = T> = (index: number, item: T) => R;

const trackByIdentiy: TrackBy<{}> = (index, item) => item;

enum PatchOperation {
	ADD = 'add',
	REMOVE = 'remove',
	REPLACE = 'replace',
	MOVE = 'move',
	KEEP = 'keep'
};

type AllowedOperation = PatchOperation.ADD | PatchOperation.REMOVE | PatchOperation.REPLACE;

export type PatchArray = { currentIndex: number, nextIndex: number, op: AllowedOperation };
export type PatchObject = { key: string, op: AllowedOperation };
export type PatchRoot = { op: PatchOperation.REPLACE, root: true };
export type DiffPatch = PatchArray | PatchObject | PatchRoot;

export class JSONPatch {

	protected diffArray<T extends {}>(input: T[], output: T[]): PatchArray[];
	protected diffArray<T extends {}, R>(input: T[], output: T[], trackBy: TrackBy<T, R>): PatchArray[];
	protected diffArray(input: any[], output: any[], trackBy: TrackBy<any, any> = trackByIdentiy): DiffPatch[] {
		type DiffArray = Omit<PatchArray, 'op'> & { ignore?: boolean, op: PatchOperation };
		const identityInput = trackBy == trackByIdentiy ? input : input.map((item, index) => trackBy(index, item));
		const identityOutput = trackBy == trackByIdentiy ? output : output.map((item, index) => trackBy(index, item));
		const diffArray: DiffArray[] = [];
		identityInput.forEach((item, index) => {
			const nextIndex = identityOutput.indexOf(item);
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
			const oldIndex = identityInput.indexOf(item);
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
				const replacedItem = diffArray.find(r => r.nextIndex == item.currentIndex);
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
			.filter(item => PatchOperation.REMOVE == item.op)
			.sort((a, b) => b.currentIndex - a.currentIndex);
		const apply = patchArray
			.filter(item => PatchOperation.REMOVE != item.op && PatchOperation.MOVE != item.op)
			.sort((a, b) => a.nextIndex - b.nextIndex);
		return removed.concat(apply) as PatchArray[];
	}

	protected diffObject<T = any>(input: T, output: T): PatchObject[] {
		return [];
	}

	diff<T extends {}>(input: T, output: T): PatchObject[];
	diff<T extends {}>(input: T[], output: T[]): PatchArray[];
	diff<T extends {}, R>(input: T[], output: T[], trackBy: TrackBy<T, R>): PatchArray[];
	diff(input: any, output: any, trackBy: TrackBy<any, any> = trackByIdentiy): DiffPatch[] {
		if (Array.isArray(input) && Array.isArray(output)) {
			return this.diffArray(input, output, trackBy);
		} else if (typeof input == 'object' && typeof output == 'object') {
			return this.diffObject(input, output);
		}
		return [{ op: PatchOperation.REPLACE, root: true }];
	}
}

const jsonPatch = new JSONPatch();

export const diff = jsonPatch.diff.bind(jsonPatch);
