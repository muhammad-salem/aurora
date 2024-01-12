import { Component, signal } from '@ibyar/aurora';


@Component({
	selector: 'simple-counter',
	template: `
			<!-- count is invoked as a getter! -->
			<p>Count {{ count() }}</p>
			<p>{{ name }}</p> <!-- Not reactive! -->
			<button  class="btn btn-outline-success" (click)="increment()">Increment count</button>`,
})
export class SimpleCounter {
	count = signal(0); // WritableSignal<number>
	name = 'Morgan';

	increment() {
		console.log('c', this.count());
		this.count.update(c => c + 1);
	}

}
