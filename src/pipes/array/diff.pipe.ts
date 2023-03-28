import { Metadata, MetadataContext, Pipe, PipeTransform } from '@ibyar/core';

@Pipe({ name: 'diff' })
export class DiffPipe<T> implements PipeTransform<Array<T>, Array<T>> {

	@Metadata
	static [Symbol.metadata]: MetadataContext;

	transform(input: Array<T>, ...diffArrays: Array<T>[]): Array<T> {
		if (!Array.isArray(input)) {
			return input as any;
		}

		return diffArrays.reduce((d, c) => d.filter(e => !~c.indexOf(e)), input);
	}

}
