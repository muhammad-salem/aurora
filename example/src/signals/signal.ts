import { Component, OnDestroy, computed, effect, lazy, signal, untracked } from '@ibyar/aurora';


@Component({
	selector: 'simple-counter',
	template: `
			<!-- count is invoked as a getter! -->
			<p>Count {{ count() }}</p>
			<p>{{ name }}</p> <!-- Not reactive! -->
			<button class="btn btn-outline-success" (click)="increment()">Increment count</button>
			<hr>
			<p>x {{ x() }}</p>
			<p>y {{ y() }}</p>
			<p>z {{ z() }}</p>
			<p>a {{ a() }}</p>
			<p>g {{ g() }}</p>
			<p>h {{ h() }}</p>
			<hr>

			<div class="row">
				<div class="col-4">
					<label class="form-label">X:</label>
					<input type="number" class="form-control" [value]="x()" (change)="x.set(+$event.target.value)">
				</div>
				<div class="col-4">
					<label class="form-label">Y:</label>
					<input type="number" class="form-control" [value]="y()" (change)="y.set(+$event.target.value)">
				</div>
				<div class="col-4">
					<label class="form-label">Z:</label>
					<input type="number" class="form-control" [value]="z()" (change)="z.set(+$event.target.value)">
				</div>
			</div>
			<div class="row">
				<div class="col-4">
					<div class="form-check">
						<input class="form-check-input" type="checkbox" id="a"
							[checked]="a()" (change)="a.set($event.target.checked)">
						<label class="form-check-label" for="a">A</label>
					</div>
				</div>
			</div>
			<hr>


			<p>lazy x*y= {{ l() }} <button class="btn btn-outline-success" (click)="l()">Refresh value</button></p>
			<p>double g = <span [class]="{'text-danger': e() instanceof Error}">{{ e() }}</span> (error if a = false)</p>

		`,
})
export class SimpleCounter implements OnDestroy {
	count = signal(0); // WritableSignal<number>

	x = signal(6);
	y = signal(4);
	z = signal(20);
	a = signal(true);

	l = lazy(() => this.x() * this.y());
	e = computed(() => {
		if (this.a()) {
			return this.g() * 2;
		}
		throw new Error('throw exception');
	});

	Error = Error;



	g = computed(() => {
		if (this.a()) {
			return this.x() + this.y();
		}
		return this.x() + this.z();
	});

	h = computed(this.g);

	private effectSubscription: { destroy(): void; };


	constructor() {
		this.effectSubscription = effect(() => {
			console.log(
				'x', this.x(),
				'y', this.y(),
				'z', this.z(),
				'a', this.a(),
				'g', untracked(this.g),
				'h', untracked(this.h),
			);
		});
	}


	increment() {
		console.log('c', this.count());
		this.count.update(c => c + 1);
	}

	onDestroy(): void {
		this.effectSubscription.destroy();
	}

}

