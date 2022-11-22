import { AttributeDirective, Directive, Input, OnInit } from '@ibyar/core';
import { ControlValue, isControlValue } from '../builder/form-builder.js';
import { AbstractControl, FormControl } from './form-control.js';

export abstract class AbstractFormGroup<T extends { [K in keyof T]: AbstractControl<any>; } = any> extends AbstractControl<T> {
	controls: Record<keyof T, AbstractControl<T[keyof T]>>;
	abstract get<C extends AbstractControl<any>>(key: string): C;

	abstract addControl<K extends string & keyof T>(name: K, control: T[K]): AbstractControl<T[K]>;
	abstract addControl<K extends string & keyof T>(name: K, control: ControlValue<T[K]>): AbstractControl<T[K]>;
	abstract addControl<K extends string & keyof T>(name: K, control: AbstractControl<T[K]>): AbstractControl<T[K]>;
	abstract addControl<K extends string & keyof T>(name: K, value: T[K] | ControlValue<T[K]> | AbstractControl<T[K]>): AbstractControl<T[K]>;

	abstract removeControl<K extends string & keyof T>(name: K): void;
}

export class FormGroup<T> extends AbstractFormGroup<T> {
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
	get<C extends AbstractControl<any>>(key: string): C {
		throw new Error('Method not implemented.');
	}

	addControl<K extends string & keyof T>(name: K, control: T[K]): AbstractControl<T[K]>;
	addControl<K extends string & keyof T>(name: K, control: ControlValue<T[K]>): AbstractControl<T[K]>;
	addControl<K extends string & keyof T>(name: K, control: AbstractControl<T[K]>): AbstractControl<T[K]>;
	addControl<K extends string & keyof T>(name: K, value: T[K] | ControlValue<T[K]> | AbstractControl<T[K]>): AbstractControl<T[K]> {
		const control = value instanceof AbstractControl
			? value
			: isControlValue(value)
				? new FormControl(value.value, value.disabled)
				: new FormControl(value);
		this.controls[name] = control;
		return control;
	}
	removeControl<K extends string & keyof T>(name: K): void {
		delete this.controls[name];
	}
	updateValue(value: T | null): void {
		throw new Error('Method not implemented.');
	}
	updateValidity(): void {
		throw new Error('Method not implemented.');
	}
}


@Directive({
	selector: 'formGroup'
})
export class FormGroupDirective extends AttributeDirective implements OnInit {

	declare protected el: HTMLFormElement;

	@Input('formGroup')
	formGroup: FormGroup<any>;

	onInit(): void {
		console.log('el', this.el);
		console.log('formGroup', this.formGroup);
	}

}
