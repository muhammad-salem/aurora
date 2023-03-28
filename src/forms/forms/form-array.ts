import { AttributeDirective, Directive, Metadata, MetadataContext } from '@ibyar/core';
import { AbstractControl } from './form-control.js';


export abstract class AbstractFormArray<T = any> extends AbstractControl<T> {

	protected controls: AbstractControl<T[keyof T]>[] = [];

	abstract at<C extends AbstractControl<T[keyof T]>>(index: number): C;
	abstract push<C extends AbstractControl<T[keyof T]>>(control: C): C;
}

export class FormArray<T = any> extends AbstractFormArray<T> {

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
	at<C extends AbstractControl<T[keyof T]>>(index: number): C {
		return this.controls.at(index) as C;
	}
	push<C extends AbstractControl<T[keyof T]>>(control: C): C {
		this.controls.push(control);
		return control;
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

	@Metadata
	static [Symbol.metadata]: MetadataContext;

}

@Directive({
	selector: 'formArrayName'
})
export class FormArrayNameDirective extends AttributeDirective {

	@Metadata
	static [Symbol.metadata]: MetadataContext;

}
