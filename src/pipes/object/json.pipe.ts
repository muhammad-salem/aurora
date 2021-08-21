import { Pipe, PipeTransform } from '@ibyar/core';

@Pipe({
	name: 'json'
})
export class JSONPipe implements PipeTransform<object, string>{
	transform(obj: object, replacer?: (this: any, key: string, value: any) => any, space?: string | number): string {
		return JSON.stringify(obj, replacer, space);
	}
}
