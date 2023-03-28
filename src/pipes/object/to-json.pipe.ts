import { Metadata, MetadataContext, Pipe, PipeTransform } from '@ibyar/core';

@Pipe({
	name: 'toJson'
})
export class ToJSONPipe implements PipeTransform<string, any> {

	@Metadata
	static [Symbol.metadata]: MetadataContext;

	transform(text: string, reviver?: ((this: any, key: string, value: any) => any)): any {
		return JSON.parse(text, reviver);
	}
}
