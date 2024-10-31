import {
	Component, Injectable, OnDestroy,
	OnInit, computed, effect, inject,
	input, lazy, output, signal, untracked
} from '@ibyar/aurora';


@Injectable({})
export class SignalScopeService {

	date = signal(new Date());

}

@Component({
	selector: 'simple-counter',
	template: `
			<!-- count is invoked as a getter! -->
			<p>Count {{ count.get() }}</p>
			<p>{{ name.get() }}</p> <!-- Not reactive! -->
			<button class="btn btn-outline-success" (click)="increment()">Increment count</button>
			<hr>
			<p>x {{ x.get() }}</p>
			<p>y {{ y.get() }}</p>
			<p>z {{ z.get() }}</p>
			<p>a {{ a.get() }}</p>
			<p>g {{ g.get() }}</p>
			<p>h {{ h.get() }}</p>
			<hr>

			<div class="row">
				<div class="col-4">
					<label class="form-label">X:</label>
					<input type="number" class="form-control" [value]="x.get()" (change)="x.set(+$event.target.value)">
				</div>
				<div class="col-4">
					<label class="form-label">Y:</label>
					<input type="number" class="form-control" [value]="y.get()" (change)="y.set(+$event.target.value)">
				</div>
				<div class="col-4">
					<label class="form-label">Z:</label>
					<input type="number" class="form-control" [value]="z.get()" (change)="z.set(+$event.target.value)">
				</div>
			</div>
			<div class="row">
				<div class="col-4">
					<div class="form-check">
						<input class="form-check-input" type="checkbox" id="a"
							[checked]="a.get()" (change)="a.set($event.target.checked)">
						<label class="form-check-label" for="a">A</label>
					</div>
				</div>
			</div>
			<hr>


			<p>lazy x*y= {{ l.get() }} <button class="btn btn-outline-success" (click)="l.get()">Refresh value</button></p>
			<p>double g = <span [class]="{'text-danger': e.get() instanceof Error}">{{ e.get() }}</span> (error if a = false)</p>

			<hr>
			<p>date: {{ date.get() }}</p>

		`,
})
export class SimpleCounter implements OnInit, OnDestroy {
	count = signal(0); // WritableSignal<number>

	x = signal(6);
	y = signal(4);
	z = signal(20);
	a = signal(true);

	readonly name = input('name');
	readonly age = input.required();

	readonly inputWithAlias = input('init-value', { alias: 'alias-name-1' });
	readonly requiredInputWithAlias = input.required({ alias: 'alias-name-2' });

	readonly event = output<string>();

	l = lazy(() => this.x.get() * this.y.get());
	e = computed(() => {
		if (this.a.get()) {
			return this.g.get() * 2;
		}
		throw new Error('throw exception');
	});

	Error = Error;



	g = computed(() => {
		if (this.a.get()) {
			return this.x.get() + this.y.get();
		}
		return this.x.get() + this.z.get();
	});

	h = computed(this.g.get);

	service = inject(SignalScopeService);

	date = computed(() => this.service.date.get().toISOString());

	private effectSubscription = effect(() => {
		console.log(
			'x', this.x.get(),
			'y', this.y.get(),
			'z', this.z.get(),
			'a', this.a.get(),
			'g', untracked(this.g),
			'h', untracked(this.h),
		);
	});
	private interval: any;

	onInit(): void {
		this.interval = setInterval(() => this.service.date.update(() => new Date()), 1000);
		this.event.emit('x = ' + this.x.get());
	}

	increment() {
		console.log('c', this.count.get());
		this.count.update(c => c + 1);
	}

	onDestroy(): void {
		this.effectSubscription.destroy();
		clearInterval(this.interval);
	}

}

