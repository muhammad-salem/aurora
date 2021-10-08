import { Component, Input, View, HostListener, isModel } from '@ibyar/aurora';
import { Person, PersonModel } from './person';

@Component({
	selector: 'person-app',
	template: `
		<div>
			{{appVersion}}
			{{appName}}
		</div>

		<h1 [textContent]="title"></h1>

		<div class="row">
			<div class="col-4">
				{{personUtils.getDetails(person1)}}
			</div>
			<for expression="let {key, value} of person1 |> keyvalue">
				<div class="col-4">{{key}}: {{value}}</div>
			</for>
		</div>

		<person-edit #personEdit [(person)]="person1" (save)="printPerson($event)"></person-edit>

		<progress-bar [(value)]="person1.age" min="0" max="100"></progress-bar>

		<progress-bar *if="person1.age > 35; else showTest" [(value)]="person1.age" min="0" max="100"></progress-bar>
		<template #showTest>age is less than 35</template>

		<div class="row">
			<div class="col-3">
				<person-view #pm1 [(person)]="person1" name="dddddddd" age="34" allowed="true"
					@click="onClose('person:clicked')"></person-view>
			</div>
			<div class="col-3">
				<person-view #pm2 [(person)]="person2" name="alex2" age="19"></person-view>
			</div>
			<div class="col-3">
				<person-view #pm3 [(person)]="people[2]" name="jones" age="25"></person-view>
			</div>
			<div class="col-3">
				<person-view #pm4 person="{{person4}}" name="alex" age="29"></person-view>
			</div>
		</div>

		<hr>

		<h1>For Loop Directive</h1>
		<h5>*for="let index = 0; index &lt; people.length; index++"</h5>
		<div class="row">
			<div class="col-3" *for="let index = 0; index < people.length; index++">
				<p>Name: <span>{{people[index].name}}</span></p>
				<p>Age: <span>{{people[index].age}}</span></p>
			</div>
		</div>

		<h1>For Of Directive</h1>
		<h5>*for="let user of people"</h5>
		<div class="row">
			<div class="col-3" *for="let user of people">
				<p>Name: <span>{{user.name}}</span></p>
				<p>Age: <span>{{user.age}}</span></p>
			</div>
		</div>

		<h1>For In Directive</h1>
		<h5>*for="let key in person1"</h5>
		<div class="row">
			<div class="col-3" *for="let key in person1">
				<p>Key: <span>{{key}}</span></p>
				<p>Value: <span>{{person1[key]}}</span></p>
			</div>
		</div>

		<h1>For Await OF Directive</h1>
		<h5>*for="await (let num of asyncIterable)"</h5>
		<div class="row">
			<div class="col-3" *for="await (let num of asyncIterable)">
				<p>num = <span>{{num}}</span></p>
			</div>
		</div>

		<hr>
		<h1>While Directive</h1>
		<h5>*while="i &lt; people.length"</h5>
		<div class="row">
			<div class="col-3" *while="i < people.length">
				<p>Name: <span>{{people[i].name}}</span></p>
				<p>Age: <span>{{people[i++].age}}</span></p>
			</div>
		</div>
		<h1>While Directive</h1>
		<h5>*while="let index = 0; index &lt; people.length"</h5>
		<div class="row">
			<div class="col-3" *while="let index = 0; index < people.length">
				<p>Name: <span>{{people[index].name}}</span></p>
				<p>Age: <span>{{people[index++].age}}</span></p>
			</div>
		</div>

		<hr>

		<h1>Switch Case Directive</h1>
		<h5>*switch="1"</h5>
		<div class="row">
			<div class="col-3" *switch="1">
				<div *case="1">One</div>
				<div *case="2">Two</div>
				<div *case="3">Three</div>
				<div *default>default: Zero</div>
			</div>
		</div>
		<hr>
		`
})
export class PersonApp {
	@Input()
	appVersion: string = '21.10.01';

	title = 'Testing Components';

	@Input()
	appName = 'Ibyar Aurora';

	@Input()
	name = 'alice';

	@View()
	view: HTMLElement;

	person1: Person = { name: 'alice', age: 39 };
	person2: Person = { name: 'alex', age: 46 };
	person3: Person = { name: 'delilah', age: 25 };
	person4: Person = { name: 'alice', age: 14 };

	people = [this.person1, this.person2, this.person3, this.person4];
	i = 0;

	asyncIterable = {
		[Symbol.asyncIterator]() {
			return {
				i: 0,
				next() {
					if (this.i < 3) {
						return Promise.resolve({ value: this.i++, done: false });
					}
					return Promise.resolve({ done: true });
				}
			};
		}
	};

	personUtils = {
		x: 3,
		getDetails(person: Person) {
			console.log(this);
			return `${person.name} is ${person.age} years old.`;
		}
	};

	@HostListener('person1:select')
	onClose(data: any) {
		console.log('AppRoot => person1:select', data);
		// setTimeout(() => {
		// 	if (isModel(this)) {
		// 		this.emitChangeModel('asyncIterable');
		// 	}
		// }, 3000);
	}

	@HostListener('personEdit:input')
	onPersonEdit(data: any) {
		console.log('personEdit:input', data, this.view);
	}

	@HostListener('personEdit:person.age')
	onPersonAge(data: any) {
		console.log('personEdit:person.age', data, this.view);
	}

	printPerson(person: PersonModel) {
		console.log('printPerson', person);
	}
}
