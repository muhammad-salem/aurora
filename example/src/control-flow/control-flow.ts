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
		Local template variables ==>  \\@let double = 2 * x; \\@let y = x + 2, z = x - 2;
		<hr>
		@let double = 2 * x;
		@let y = x + 2, z = x - 2;
		<div class="d-flex flex-column">
			<span class="ms-5"> x - 2 = {{z}}</span>
			<span class="ms-5">x = {{x}} </span>
			<span class="ms-5"> x + 2 = {{y}}</span>
			<span class="ms-5"> x * 2 = {{double}}</span>
		</div>
		<hr>
		<table class="table">
			<thead>
				<tr>
					<th>number</th>
					<th>number + 2</th>
					<th>number - 2</th>
					<th>number * 2</th>
					<th>number / 2</th>
					<th>number % 2</th>
				</tr>
			</thead>
			<tbody>
				@for(let num of [1,2,3,4,5]){
					@let a = num + 2, b = num -2, c = num * 2, d = num /2, e = num %2;
					<tr>
						<td>{{num}}</td>
						<td>{{a}}</td>
						<td>{{b}}</td>
						<td>{{c}}</td>
						<td>{{d}}</td>
						<td>{{e}}</td>
					</tr>
				}
			</tbody>
		</table>
		<hr>
	`
})
export class ControlFlowExample implements OnInit, OnDestroy {
	x = 4;

	list = [1, 2, 3, 4, 5, 6, 7, 8, 9];
	interval: number;

	onInit(): void {
		this.interval = setInterval(() => this.x++, 1000) as any;
	}

	onDestroy(): void {
		clearInterval(this.interval);
	}

}