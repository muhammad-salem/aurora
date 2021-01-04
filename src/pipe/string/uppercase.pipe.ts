import { Pipe, PipeTransform } from '@aurorats/api';

@Pipe({
    name: 'uppercase'
})
export class UpperCasePipe implements PipeTransform<string, string>{
    transform(value: string, ...args: any[]): string {
        return value.toUpperCase();
    }
}
