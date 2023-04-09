
import { Component, Directive, Input, Pipe } from '@ibyar/aurora';


@Pipe({ name: 'pipe' })
@Directive({ selector: 'parent' })
export class Parent {
	@Input()
	name: string;
}


console.log('Parent frozen', JSON.parse(JSON.stringify(Reflect.get(Parent, Symbol.metadata))));
console.log('Parent ref', Reflect.get(Parent, Symbol.metadata));


@Component({
	selector: 'child-comp'
})
export class Child extends Parent {

	@Input()
	age: number;
}

console.log('Child frozen', JSON.parse(JSON.stringify(Reflect.get(Child, Symbol.metadata))));
console.log('Child ref', Reflect.get(Child, Symbol.metadata));

