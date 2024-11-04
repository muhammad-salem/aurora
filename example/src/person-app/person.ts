import {
	Component, HostBinding, HostListener,
	Injectable, Input, OnInit, output,
	view, inject, viewChild,
} from '@ibyar/aurora';


@Injectable({})
export class LogService {

	info(message: string) {
		let date = new Date();
		console.log(
			`${date.getHours()}:${date.getMinutes()}:${date.getSeconds()} -- ${message}`
		);
	}

	log(...args: any[]) {
		let date = new Date();
		console.log(
			`${date.getHours()}:${date.getMinutes()}:${date.getSeconds()} -- `,
			...args
		);
	}

}

export interface Person {
	name: string;
	age: number;
}

const style = `

.valid {
	display: inline-block;
    width: 5rem;
    height: 5rem;
    margin: 0.25rem;
    background-color: #f5f5f5;
	border-color: #198754
}

.invalid {
	display: inline-block;
    width: 5rem;
    height: 5rem;
    margin: 0.25rem;
    background-color: #f5f5f5;
	border-color: #dc3545
}
`;

@Component({
	selector: 'person-view',
	template: `
			<p id="p-name" #nameArea class="{{className}}" onclick="onResize()">
				Person name is {{person.name}}
			</p>
			<p id="p-age" #ageArea>your age is: {{person.age}}, born in Year of {{yearOfBirth}}</p>
			<button class="btn btn-outline-primary" (click)="addOneYear()">+1</button>
			<button class="btn btn-outline-secondary" (click)="person.age--">-1</button>
			<div *if="person.age >= 18">
				Can have license
				<p>Data</p>
			</div>`,
	styles: style,
})
export class PersonView implements OnInit {

	@Input()
	person: Person = {
		name: 'Delilah',
		age: 24
	};

	open = output<string>();
	_select = output<Person>({ alias: '_select', bubbles: true });


	className: string = 'p1 m1';

	view = view();

	childName = viewChild<HTMLParagraphElement>('p-name');
	childAge = viewChild<HTMLParagraphElement>('p-age');


	@HostBinding('class.on')
	on: boolean;

	@HostBinding('class.off')
	off: boolean;

	private logger = inject(LogService);

	onInit(): void {
		this.on = true;
		this.off = !this.on;
		this.logger.log('onInit', this);
		this.open.emit('init data');
	}

	get yearOfBirth() {
		return 2021 - this.person.age;
	}

	@HostListener('window:load', ['$event'])
	onLoad(e: Event) {
		this.logger.log(this, e);
	}

	@HostListener('window:resize', ['$event'])
	onResize(e: Event) {
		this.logger.log(this, e);
	}

	@HostListener('click', ['$event.target'])
	onClick(target: HTMLElement) {
		this.logger.log('target', target);
		this._select.emit(this.person);
		this.off = this.on;
		this.on = !this.on;
	}

	@HostListener('select', '$event.detail')
	onClose(person: Person) {
		this.logger.log('select person', person);
	}

	@HostListener('person.age')
	personChange() {
		this.logger.log('age change', this.person.age);
	}

	@Input()
	set resize(msg: string) {
		this.logger.log(this, msg);
	}

	collectData(data: Object, ddd: Person, p: Person): string[] {
		return [];
	}

	addOneYear() {
		this.person.age++;
	}
}

@Component({
	selector: 'person-edit',
	template: `<form #form>
					<input if="show" type="text" [(value)]="person.name" />
					<input type="number" [(value)]="person.age" />
					<input type="button" (click)="printPerson()" value="Save" />
				</form>`
})
export class PersonEdit {

	@Input()
	person: Person;

	@Input()
	show = true;

	save = output<Person>();

	private logger = inject(LogService);

	printPerson() {
		this.logger.log(this.person);
		this.save.emit(this.person);
	}
}


@Component({
	selector: 'progress-bar',
	template: '<progress [max]="max" [value]="value"></progress>'
})
export class ProgressBar {

	@Input()
	max: number;

	@Input()
	value: number;

}
