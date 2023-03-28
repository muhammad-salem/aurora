import { Metadata, MetadataContext, Pipe, PipeTransform } from '@ibyar/core';

@Pipe({ name: 'every' })
export class EveryPipe<T> implements PipeTransform<Array<T>, boolean> {

	@Metadata
	static [Symbol.metadata]: MetadataContext;

	transform(input: Array<T>, predicate: (value: T, index: number, array: T[]) => unknown): boolean {
		return Array.isArray(input) ? input.every(predicate) : false;
	}

}
