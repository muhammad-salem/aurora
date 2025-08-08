export type TrackBy<T, R = T> = (index: number, item: T) => R;
export type DiffOptions<T, R = T> = { trackBy?: TrackBy<T, R> };


/**
 * in memory patch operations
 */
export enum PatchOperation {
	ADD = 'add',
	REMOVE = 'remove',
	MOVE = 'move',
};

export type PatchArray<T> = { currentIndex: number, nextIndex: number, op: PatchOperation, item: T };
export type PatchObject = { key: string, op: PatchOperation };
export type DiffPatch<T> = PatchArray<T> | PatchObject;

export class JSONPatch {

	protected diffArray<T, R = T>(input: T[], output: T[], options?: DiffOptions<T, R>): PatchArray<T>[] {
		const trackBy = options?.trackBy;
		const identityInput = (trackBy && input.map((item, index) => trackBy(index, item))) ?? input.slice() as unknown as R[];
		const identityOutput = (trackBy && output.map((item, index) => trackBy(index, item))) ?? output.slice() as unknown as R[];
		const diff: PatchArray<T>[] = [];
		for (let currentIndex = identityInput.length - 1; currentIndex >= 0; currentIndex--) {
			const item = identityInput[currentIndex];
			const nextIndex = identityOutput.indexOf(item);
			if (nextIndex !== -1) {
				continue;
			}
			diff.push({
				nextIndex,
				currentIndex,
				op: PatchOperation.REMOVE,
				item: input[currentIndex]
			});
			identityInput.splice(currentIndex, 1);
		}
		identityOutput.forEach((item, nextIndex) => {
			const currentIndex = identityInput.indexOf(item);
			if (currentIndex === nextIndex) {
				return;
			}
			const op = currentIndex === -1 ? PatchOperation.ADD : PatchOperation.MOVE;
			diff.push({
				op,
				nextIndex,
				currentIndex,
				item: output[nextIndex]
			});
			if (op === PatchOperation.MOVE) {
				identityInput.splice(currentIndex, 1);
			}
			identityInput.splice(nextIndex, 0, item);
		});
		return diff;
	}

	protected diffObject<T = any>(input: T, output: T): PatchObject[] {
		return [];
	}

	diff<T = any>(input: T, output: T): PatchObject[];
	diff<T>(input: T[], output: T[]): PatchArray<T>[];
	diff<T, R>(input: T[], output: T[], options?: DiffOptions<T, R>): PatchArray<T>[];
	diff(input: any, output: any, options?: DiffOptions<any, any>): DiffPatch<any>[] {
		if (Array.isArray(input) && Array.isArray(output)) {
			return this.diffArray(input, output, options);
		} else if (typeof input == 'object' && typeof output == 'object') {
			return this.diffObject(input, output);
		}
		throw new Error('Not supported operation');
	}
}

const jsonPatch = new JSONPatch();

export function diff<T = any>(input: T, output: T): PatchObject[];
export function diff<T>(input: T[], output: T[]): PatchArray<T>[];
export function diff<T, R>(input: T[], output: T[], options?: DiffOptions<T, R>): PatchArray<T>[];
export function diff(input: any, output: any, options?: DiffOptions<any, any>): DiffPatch<any>[] {
	return jsonPatch.diff(input, output, options);
}
