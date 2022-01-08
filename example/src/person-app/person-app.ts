import { Component, Input, View, HostListener } from '@ibyar/aurora';
import { Person, PersonModel } from './person';

@Component({
	selector: 'person-app',
	template: `
		<div *time></div>
		<template *time let-HH="hh" let-MM="mm" let-SS="ss">{{HH}}:{{MM}}:{{SS}}</template>
		<div *add-note>
			{{appVersion}}
			{{appName}}
		</div>
		<notify-user type="primary" message="A simple primary alert—check it out!"></notify-user>

		<h1 [textContent]="title"></h1>
		
		<red-note>text child in directive</red-note>

		<div class="row">
			<div class="col-4">
				{{personUtils.getDetails(person1)}}
			</div>
			<template *forOf="let {key, value} of person1 |> keyvalue">
				<div class="col-4">{{key}}: {{value}}</div>
			</template>
		</div>

		<person-edit #personEdit [(person)]="person1" (save)="printPerson($event)"></person-edit>

		<progress-bar [(value)]="person1.age" min="0" max="100"></progress-bar>

		<template					*if="person1.age < 20; else between_20_39"						>age is less than 20</template>
		<template #between_20_39	*if="person1.age > 19 && person1.age < 40; else between_40_79"	>age is between 20 and 39</template>
		<template #between_40_79	*if="person1.age > 39 && person1.age < 60; else between_80_100" >age is between 40 and 59</template>
		<template #between_80_100	*if="person1.age > 59 && person1.age < 80; else showTest" 		>age is between 60 and 79</template>
		<template #showTest																			>age is more than 80</template>

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

		<h1>*For Of Directive</h1>
		<h5>*forOf="let user of people"</h5>
		<div class="row">
			<div class="col-3" *forOf="let user of people">
				<p>Name: <span>{{user.name}}</span></p>
				<p>Age: <span>{{user.age}}</span></p>
			</div>
		</div>

		<h1>*For In Directive</h1>
		<h5>*forIn="let key in person1"</h5>
		<div class="row">
			<div class="col-3" *forIn="let key in person1">
				<p>Key: <span>{{key}}</span></p>
				<p>Value: <span>{{person1[key]}}</span></p>
			</div>
		</div>

		<h1>*For Await OF Directive</h1>
		<h5>*forAwait="let num of asyncIterable"</h5>
		<div class="row">
			<div class="col-3" *forAwait="let num of asyncIterable">
				<p>num = <span>{{num}}</span></p>
			</div>
		</div>

		<hr>

		<h1>Switch Case Directive</h1>
		<h5>*switch="{{selectFruit}}"</h5>
		<ul class="list-group">
			<li class="list-group-item row">
				<div class="col-3" *switch="selectFruit">
					<div *case="'oranges'">Oranges</div>
					<div *case="'apples'">Apples</div>
					<div *case="'bananas'">Bananas</div>
					<div *default>Not Found</div>
				</div>
			</li>
			<li class="list-group-item row">
				<select class="form-select col-3" (change)="selectFruit = this.value">
					<option *forOf="let fruit of fruits"
						[value]="fruit"
						>{{fruit |> titlecase}}</option>
				</select>
			</li>
		</ul>
		<hr>
		`
})
export class PersonApp {
	@Input()
	appVersion: string = '22.01.08';

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

	fruits = [
		'mangoes',
		'oranges',
		'apples',
		'bananas',
		'cherries',
	];
	selectFruit = 'bananas';
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
