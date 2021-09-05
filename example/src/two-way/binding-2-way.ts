import { Component, HostListener } from '@ibyar/aurora';
import { interval } from 'rxjs';

@Component({
	selector: 'bind-2way',
	extend: 'div',
	template: `
    <div class="row">
        <input class="col-sm-12" type="text" [(value)]="data1" />
        <pre class="col-sm-12">{{data1}} {{timer |> async}}</pre>
    </div>
    <div class="row">
        <input class="col-sm-12" type="text" [(value)]="data2" />
        <pre class="col-sm-12">{{data2 |> lowercase}} {{timer |> async}}</pre>
    </div>
    <hr />
    `
})
export class Binding2Way {

	data1 = 'two way data binding';
	data2 = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla laoreet';

	timer = interval(1000);

	@HostListener('data1')
	onDataOneChange() {
		console.log(`onDataOneChange ==> ${this.data1}`);
	}

	@HostListener('data2')
	onDataTwoChange() {
		console.log(`onDataTwoChange  ==> ${this.data2}`);
	}

}
