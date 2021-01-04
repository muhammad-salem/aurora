import { Pipe, PipeTransform } from '@aurorats/api';

@Pipe({
    name: 'lowercase'
})
export class LowerCasePipe implements PipeTransform<string, string>{
    transform(value: string, ...args: any[]): string {
        return value.toLowerCase();
    }
}
