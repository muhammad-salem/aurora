import { Pipe, PipeTransform } from '@ibyar/core';

@Pipe({
	name: 'toJson'
})
export class ToJSONPipe implements PipeTransform<string, any> {

	transform(text: string, reviver?: ((this: any, key: string, value: any) => any)): any {
		return JSON.parse(text, reviver);
	}
}
