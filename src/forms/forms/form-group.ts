import { AttributeDirective, Directive, HostBinding, HostListener, input, OnInit } from '@ibyar/core';
import { AbstractControl } from './form-control.js';
import { AbstractFormArray } from './form-array.js';

export type GroupControlType<T, K extends keyof T> = T[K] extends Array<infer A>
	? AbstractFormArray<A>
	: T[K] extends { [key in K]: infer G }
	? AbstractFormGroup<G>
	: AbstractControl<T[K]>
	;

export type GroupeControls<T> = { [K in keyof T]: GroupControlType<T, K> };

export abstract class AbstractFormGroup<T> extends AbstractControl<T> {
	controls: GroupeControls<T>;

	constructor(controls?: GroupeControls<T>) {
		super();
		this.controls = controls ?? {} as GroupeControls<T>;
	}
	abstract get<K extends keyof T>(name: K): GroupControlType<T, K> | undefined;
	abstract addControl<K extends keyof T>(name: K, control: GroupControlType<T, K>): void;
	abstract removeControl<K extends keyof T>(name: K): void;
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

	get<K extends keyof T>(key: K): GroupControlType<T, K> | undefined {
		return this.controls[key];
	}

	addControl<K extends keyof T>(name: K, control: GroupControlType<T, K>): void {
		this.controls[name] = control;
	}

	removeControl<K extends keyof T>(name: K): void {
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
export class FormGroupDirective<T> extends AttributeDirective implements OnInit {

	declare protected el: HTMLFormElement;


	formGroup = input<FormGroup<T>>();

	onInit(): void {
		this.el.noValidate = true;
		console.log('el', this.el);
		console.log('formGroup', this.formGroup.get());
		const elements = this.el.elements;
		const length = elements.length;
		for (let i = 0; i < length; i++) {
			const element = elements.item(i) as HTMLInputElement;
			if (element.type === 'submit' || element.type === 'hidden' || !element.name) {
				continue;
			}
			const value = this.formGroup.get().controls[element.name as keyof T].value as string | undefined;
			if (value) {
				element.value = value;
			}
		}
	}

	@HostListener('submit', ['$event'])
	onSubmit(event: Event) {
		console.log('directive host listener works');
		console.log('$event', event);
		event.preventDefault();
		const formData = new FormData(event.target as HTMLFormElement);
		const collect = {};
		formData.forEach((value, key) => Reflect.set(collect, key, value));
		console.log('collect', collect);
	}



	@HostBinding('class.valid')
	get valid(): boolean {
		return true;
	}

}

