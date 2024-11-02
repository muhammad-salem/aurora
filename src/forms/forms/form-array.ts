import { AttributeDirective, Directive } from '@ibyar/core';
import { AbstractControl } from './form-control.js';
import { AbstractFormGroup } from './form-group.js';

export type ArrayControlType<T> = T extends { [key in keyof T]: any }
	? AbstractFormGroup<T>
	: T extends Array<infer A>
	? AbstractFormArray<A>
	: AbstractControl<T>;

export type ArrayControls<T> = Array<ArrayControlType<T>>;

export abstract class AbstractFormArray<T> extends AbstractControl<T> {

	protected controls: ArrayControls<T>;

	constructor(controls: ArrayControls<T>) {
		super();
		this.controls = controls ?? [];
	}

	abstract at(index: number): ArrayControlType<T> | undefined;
	abstract push(control: ArrayControlType<T>): number;
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
	at(index: number): ArrayControlType<T> | undefined {
		return this.controls.at(index);
	}
	push(control: ArrayControlType<T>): number {
		return this.controls.push(control);
	}
	updateValue(value: T | null): void {
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
