import { AttributeDirective, Directive } from '@ibyar/core';
import { AbstractControl } from './form-control.js';
import { Validator, AsyncValidator } from './validators.js';


export abstract class AbstractFormArray<T> extends AbstractControl<T> {
	controls: AbstractControl<any>[];
}

export class FormArray<T> extends AbstractFormArray<T> {
	get valid(): boolean {
		throw new Error('Method not implemented.');
	}
	get invalid(): boolean {
		throw new Error('Method not implemented.');
	}
	get pristine(): boolean {
		throw new Error('Method not implemented.');
	}
	get dirty(): boolean {
		throw new Error('Method not implemented.');
	}
	get touched(): boolean {
		throw new Error('Method not implemented.');
	}
	get untouched(): boolean {
		throw new Error('Method not implemented.');
	}
	updateValue(value: T | null): void {
		throw new Error('Method not implemented.');
	}
	addValidator(validator: Validator): void {
		throw new Error('Method not implemented.');
	}
	removeValidator(validator: Validator): void {
		throw new Error('Method not implemented.');
	}
	addAsyncValidator(validator: AsyncValidator): void {
		throw new Error('Method not implemented.');
	}
	removeAsyncValidator(validator: AsyncValidator): void {
		throw new Error('Method not implemented.');
	}
	updateValidity(): void {
		throw new Error('Method not implemented.');
	}
}

@Directive({
	selector: 'formArray'
})
export class FormArrayDirective extends AttributeDirective {

}

@Directive({
	selector: 'formArrayName'
})
export class FormArrayNameDirective extends AttributeDirective {

}
