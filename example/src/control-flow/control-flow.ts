import { Component } from '@ibyar/aurora';


@Component({
	selector: 'control-flow',
	template: `
		escape \\@ by adding double \\ before \\@
		@for(let item of list; let i = index, isFirst = first, isLast = last;) {
			@if(isFirst){
				<hr>
			}
			<p>index: {{i}}, item: {{item}}</p>
			@if(isLast){
				<hr>
			}
		}
		print yes => @for(let x of []){x}@empty{y}@if('bool'){e}@else if(false){b}@else{c}@for(let x of []){m}@empty{s}
	`
})
export class ControlFlowExample {

	list = [1, 2, 3, 4, 5, 6, 7, 8, 9];

}