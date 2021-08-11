import { Pipe, PipeTransform } from '@ibyar/core';

@Pipe({ name: 'chunk' })
export class ChunkPipe<T> implements PipeTransform<Array<T>, (T | string)[][]> {

	transform(input: Array<T> | string | null | undefined, size: number): (T | string)[][] {
		if (input === undefined || input === null) return input as any;

		if (typeof input === 'string') {
			return this.chunk(input.split(''), size);
		}
		return Array.isArray(input) ? this.chunk(input, size) : input;
	}

	private chunk(input: (T | string)[], size: number): (T | string)[][] {
		return Array(Math.ceil(input.length / size))
			.fill([])
			.map((_, index) => index * size)
			.map(begin => input.slice(begin, begin + size));
	}
}
