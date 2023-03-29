import { AttributeDirective, Directive, TypeOf } from '@ibyar/core';
import type { AsyncValidator, Validator } from './validators.js';

export abstract class AbstractControl<T> {
	value: T | null | undefined;
	disabled: boolean | null | undefined;
	validators?: Validator[] | null;
	asyncValidators?: AsyncValidator[] | null;
	errors?: { [key: string]: any } | null;

	abstract get valid(): boolean;
	abstract get invalid(): boolean;
	abstract get pristine(): boolean;
	abstract get dirty(): boolean;
	abstract get touched(): boolean;
	abstract get untouched(): boolean;

	abstract updateValue(value: T | null): void;
	abstract updateValidity(): void;

	addValidator(validator: Validator): void {
		this.addValidatorByArray(validator, this.validators ??= []);
	}
	removeValidator(validator: Validator): void {
		this.removeValidatorByArray(validator, this.validators);
	}
	addAsyncValidator(asyncValidator: AsyncValidator): void {
		this.addValidatorByArray(asyncValidator, this.asyncValidators ??= []);
	}
	removeAsyncValidator(asyncValidator: AsyncValidator): void {
		this.removeValidatorByArray(asyncValidator, this.asyncValidators);
	}
	private addValidatorByArray<V = Validator | AsyncValidator>(validator: V, list: V[]): void {
		const found = list.some(this.isFound(validator, (validator as any).constructor as TypeOf<V>));
		if (found) {
			return;
		}
		list.push(validator);
	}
	private isFound<V = Validator | AsyncValidator>(validator: V, classConstructor?: TypeOf<V>) {
		if (classConstructor) {
			return (v: V) => v === validator || v instanceof classConstructor;
		}
		return (v: V) => v === validator;
	}
	private removeValidatorByArray<V = Validator | AsyncValidator>(validator: V, list?: V[] | null): void {
		if (!Array.isArray(list)) {
			return;
		}
		const index = list.indexOf(validator);
		if (index === -1) {
			return;
		}
		list.splice(index, 1);
	}
}

export class FormControl<T> extends AbstractControl<T> {

	constructor(value?: T | null, disabled?: boolean) {
		super();
		this.value = value;
		this.disabled = disabled;
	}
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
