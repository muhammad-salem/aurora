import { Component, Input, View, HostListener } from '@ibyar/core';
import { Person, PersonModel } from './person';
import { url as templateUrl } from './person-app.html';

@Component({
    selector: 'person-app',
    templateUrl: templateUrl
})
export class PersonApp {
    @Input()
    appVersion: string = '20.9.29';

    title = 'Testing Components';

    @Input()
    appName = 'testing framework';

    @Input()
    name = 'alice';

    @View()
    view: HTMLElement;

    person1: Person = { name: 'alice', age: 39 };
    person2: Person = { name: 'alex', age: 46 };
    person3: Person = { name: 'delilah', age: 25 };
    person4: Person = { name: 'alice', age: 14 };

    people = [this.person1, this.person2, this.person3, this.person4];

    @HostListener('person1:select')
    onClose(data: any) {
        console.log('AppRoot => person1:select', data);
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