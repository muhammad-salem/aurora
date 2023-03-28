import { Metadata, MetadataContext, Pipe, PipeTransform } from '@ibyar/core';

@Pipe({
	name: 'lowercase'
})
export class LowerCasePipe implements PipeTransform<string, string> {

	@Metadata
	static [Symbol.metadata]: MetadataContext;

	transform(value: string): string;
	transform(value: null | undefined): null;
	transform(value: string | null | undefined): string | null;
	transform(value: string | null | undefined): string | null {
		if (value == null) return null;
		if (typeof value !== 'string') {
			throw Error(`InvalidPipeArgument: '${value}' of '${LowerCasePipe.name}' pipe`);
		}
		return value.toLowerCase();
	}

}
