import { Pipe, PipeTransform } from '@ibyar/core';

@Pipe({ name: 'every' })
export class EveryPipe<T> implements PipeTransform<Array<T>, boolean> {

	transform(input: Array<T>, predicate: (value: T, index: number, array: T[]) => unknown): boolean {
		return Array.isArray(input) ? input.every(predicate) : false;
	}

}
