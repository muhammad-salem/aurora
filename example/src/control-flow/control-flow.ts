import { Component } from '@ibyar/aurora';


@Component({
	selector: 'control-flow',
	template: `
		@for(let item of list; let i = index, isFirst = first, isLast = last;) {
			@if(isFirst){
				<hr>
			}
			<p>index: {{i}}, item: {{item}}</p>
			@if(isLast){
				<hr>
			}
		}

		@if(false) {
			if
		} @else if(true) {
			else if
		} @else {
			else
		}

		@for(x of []) {
			show {{x}}
		} @empty {
			empty for of
		}
	`
})
export class ControlFlowExample {

	list = [1, 2, 3, 4, 5, 6, 7, 8, 9];

}