import { Metadata, MetadataContext, Pipe, PipeTransform } from '@ibyar/core';


/**
 *
 * Creates a new `Array` or `String` containing a subset (slice) of the elements.
 *
 * @usageNotes
 *
 * All behavior is based on the expected behavior of the JavaScript API `Array.prototype.slice()`
 * and `String.prototype.slice()`.
 *
 * When operating on an `Array`, the returned `Array` is always a copy even when all
 * the elements are being returned.
 *
 * When operating on a blank value, the pipe returns the blank value.
 *
 */
@Pipe({ name: 'slice' })
export class SlicePipe<T> implements PipeTransform<Array<T>, Array<T>> {

	@Metadata
	static [Symbol.metadata]: MetadataContext;

	/**
	 * @param value a list or a string to be sliced.
	 * @param start the starting index of the subset to return:
	 *   - **a positive integer**: return the item at `start` index and all items after
	 *     in the list or string expression.
	 *   - **a negative integer**: return the item at `start` index from the end and all items after
	 *     in the list or string expression.
	 *   - **if positive and greater than the size of the expression**: return an empty list or
	 * string.
	 *   - **if negative and greater than the size of the expression**: return entire list or string.
	 * @param end the ending index of the subset to return:
	 *   - **omitted**: return all items until the end.
	 *   - **if positive**: return all items before `end` index of the list or string.
	 *   - **if negative**: return all items before `end` index from the end of the list or string.
	 */
	transform(input: ReadonlyArray<T>, start: number, end?: number): Array<T>;
	transform(input: null | undefined, start: number, end?: number): null;
	transform(input: ReadonlyArray<T> | null | undefined, start: number, end?: number): Array<T> | null;
	transform(input: string, start: number, end?: number): string;
	transform(input: string | null | undefined, start: number, end?: number): string | null;
	transform(input: ReadonlyArray<T> | string | null | undefined, start: number, end?: number):
		Array<T> | string | null {
		if (input == null) return null;

		if (!this.supports(input)) {
			throw Error(`InvalidPipeArgument: '${input}' of '${SlicePipe.name}' pipe`);
		}

		return input.slice(start, end);
	}

	private supports(obj: any): boolean {
		return typeof obj === 'string' || Array.isArray(obj);
	}
}
