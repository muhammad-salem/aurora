import { Component } from '@ibyar/aurora';
import { interval } from 'rxjs';

@Component({
    selector: 'pipe-app',
    template: `
    <table class="table">
        <thead>
            <tr>
                <th scope="col">pipe</th>
                <th scope="col">expression</th>
                <th scope="col">view</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>async</td>
                <td>observable |> async</td>
                <td>{{observable |> async}}</td>
            </tr>
            <tr>
                <td>*</td>
                <td>text</td>
                <td>{{text}}</td>
            </tr>
            <tr>
                <td>lowercase</td>
                <td>text |> lowercase</td>
                <td>{{text |> lowercase}}</td>
            </tr>
            <tr>
                <td>titlecase</td>
                <td>text |> titlecase</td>
                <td>{{text |> titlecase}}</td>
            </tr>
            <tr>
                <td>uppercase</td>
                <td>text |> uppercase</td>
                <td>{{text |> uppercase}}</td>
            </tr>
            <tr>
                <td>json</td>
                <td>obj |> json</td>
                <td>{{obj |> json}}</td>
            </tr>
            <tr>
                <td>json <small>pre element</small></td>
                <td>obj |> json:undefined:2</td>
                <td>
                    <pre>{{obj |> json:undefined:2}}</pre>
                </td>
            </tr>
            <tr>
                <td>keyvalue</td>
                <td>keyValueObject |> keyvalue</td>
                <td>{{keyValueObject |> keyvalue |> json}}</td>
            </tr>
            <tr>
                <td>keyvalue</td>
                <td>keyValueObject |> keyvalue</td>
                <td>{{keyValueObject |> keyvalue |> json}}</td>
            </tr>
            <tr>
                <td>keyvalue</td>
                <td>keyValueMap |> keyvalue</td>
                <td>{{keyValueMap |> keyvalue |> json}}</td>
            </tr>
            <tr>
                <td>slice</td>
                <td>array |> slice:1:3</td>
                <td>{{array |> slice:1:3}}</td>
            </tr>
            <tr>
                <td>slice</td>
                <td>slice(array, 1, 3)</td>
                <td>{{slice(array, 1, 3)}}</td>
            </tr>
            <tr>
                <td>call windows method directly</td>
                <td>3345.54645 |> Math.trunc</td>
                <td>{{3345.54645 |> Math.trunc}}</td>
            </tr>
        </tbody>
    </table>
    `
})
export class PipeTestApp {

    text = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla laoreet.';
    obj = {
        a: [1, 2, 3],
        b: 'property b',
        c: {
            d: [],
            e: 4,
            f: [{ 5: 'g' }]
        }
    };

    keyValueObject = {
        1: 100,
        a: 'A00'
    };
    keyValueArray = [200, 300];
    keyValueMap = new Map<number, number | string>([[1, 400], [2, 500], [3, 'B200']]);

    observable = interval(1000);

    array = ['a', 'b', 'c', 'd'];

}
