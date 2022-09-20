import { AttributeDirective, Directive } from '@ibyar/core';
import type { AsyncValidator, Validator } from './validators.js';

export abstract class AbstractControl<T> {
	value: T | null;
	validator?: Validator[] | null;
	asyncValidators?: AsyncValidator[] | null;
	errors?: { [key: string]: any } | null;

	abstract get valid(): boolean;
	abstract get invalid(): boolean;
	abstract get pristine(): boolean;
	abstract get dirty(): boolean;
	abstract get touched(): boolean;
	abstract get untouched(): boolean;

	abstract updateValue(value: T | null): void;
	abstract addValidator(validator: Validator): void;
	abstract removeValidator(validator: Validator): void;
	abstract addAsyncValidator(validator: AsyncValidator): void;
	abstract removeAsyncValidator(validator: AsyncValidator): void;
	abstract updateValidity(): void;
}

export class FormControl<T> extends AbstractControl<T> {
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
	selector: 'formControl'
})
export class FormControlDirective extends AttributeDirective {


}

@Directive({
	selector: 'formControlName'
})
export class FormControlNameDirective extends AttributeDirective {


}
