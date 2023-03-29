import { Pipe, PipeTransform } from '@ibyar/core';

@Pipe({
	name: 'uppercase'
})
export class UpperCasePipe implements PipeTransform<string, string> {

	transform(value: string): string;
	transform(value: null | undefined): null;
	transform(value: string | null | undefined): string | null;
	transform(value: string | null | undefined): string | null {
		if (value == null) return null;
		if (typeof value !== 'string') {
			throw Error(`InvalidPipeArgument: '${value}' of '${UpperCasePipe.name}' pipe`);
		}
		return value.toUpperCase();
	}

}
