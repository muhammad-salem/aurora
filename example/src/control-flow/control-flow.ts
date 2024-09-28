import { Component, OnDestroy, OnInit } from '@ibyar/aurora';


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
		<hr>
		Local template variables ==>  \\@let double = 2 * x;
		<hr>
		@let double = 2 * x;
		x = {{x}} <span class="ms-5">double of x = {{double}}</span>
		<hr>
	`
})
export class ControlFlowExample implements OnInit, OnDestroy {
	x = 1;

	list = [1, 2, 3, 4, 5, 6, 7, 8, 9];
	interval: number;

	onInit(): void {
		this.interval = setInterval(() => this.x++, 1000) as any;
	}

	onDestroy(): void {
		clearInterval(this.interval);
	}

}