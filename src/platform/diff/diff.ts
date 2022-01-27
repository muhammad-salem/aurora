export type TrackBy<T, R = T> = (index: number, item: T) => R;

const trackByIdentiy: TrackBy<{}> = (index, item) => item;

enum PatchOperation {
	ADD = 'add',
	REMOVE = 'remove',
	REPLACE = 'replace'
};

export type ArrayPatch = { op: PatchOperation.ADD, index: number, value: any } | { op: PatchOperation.REMOVE, index: number } | { op: PatchOperation.REPLACE, index: number, context: any };
export type ObjectPatch = { op: PatchOperation.ADD, path: string[], value: any } | { op: PatchOperation.REMOVE, path: string[] } | { op: PatchOperation.REPLACE, path: string[], context: any };
export type DiffPatch = ArrayPatch | ObjectPatch;


export function diff(a: [], b: []): ArrayPatch[];
export function diff(a: {}, b: {}): ObjectPatch[];
export function diff<T, R>(a: [], b: [], trackBy: TrackBy<T, R>): ArrayPatch[];
export function diff<T, R>(a: {}, b: {}, trackBy: TrackBy<T, R>): ObjectPatch[];
export function diff(a: [] | {}, b: [] | {}, trackBy: TrackBy<any, any> = trackByIdentiy): DiffPatch[] {
	return [];
}
