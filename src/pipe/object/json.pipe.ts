import { Pipe, PipeTransform } from '@aurorats/api';

@Pipe({
    name: 'json'
})
export class JSONPipe implements PipeTransform<object, string>{
    transform(obj: object): string {
        return JSON.stringify(obj);
    }
}
