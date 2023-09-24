
import { Component, Directive, Input, Pipe, metadataHoler } from '@ibyar/aurora';

function debugClass(constructor: any) {
	const metadata = metadataHoler.get(Reflect.get(constructor, Symbol.metadata));
	console.log(`${constructor.name} frozen`, JSON.parse(JSON.stringify(metadata)));
	console.log(`${constructor.name} ref`, metadata);
}

@Pipe({ name: 'pipe' })
@Directive({ selector: 'parent' })
export class Parent {
	@Input()
	name: string;
}

debugClass(Parent);


@Component({
	selector: 'first-child-comp'
})
export class FirstChild extends Parent {

	@Input()
	age: number;
}

@Component({
	selector: 'last-child-comp'
})
export class LastChild extends Parent {

	@Input()
	address: number;
}



debugClass(Parent);
debugClass(FirstChild);
debugClass(LastChild);
