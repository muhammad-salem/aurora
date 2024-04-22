import { Signal } from 'signal-polyfill';
import { Component, OnInit } from '@ibyar/aurora';


@Component({
	selector: 'signal-proposal',
	template: `<div>
		<button class="btn btn-link" (click)="resetCounter()">Reset</button>
		<p>{{counter?.get()}}</p>
		<button class="btn btn-link" (click)="addCounter(+ 1)">+</button>
		<button class="btn btn-link" (click)="addCounter(- 1)">-</button>
		<input type="number" [value]="+counter?.get() ?? 100" (input)="counter?.set(+$event.target.value)"/>
	</div>`
})
export class SignalProposal implements OnInit {
	counter?: Signal.State<number> | null = new Signal.State(100);

	onInit(): void {
		setInterval(() => this.addCounter(1), 1000);
	}

	resetCounter() {
		this.counter = new Signal.State(100);
	}


	addCounter(num: number) {
		this.counter?.set(this.counter?.get() + num);
	}

}

