import { Signal, SignalScope } from '@ibyar/expressions';
import { signalScopeFactory } from '../signals/factory.js';
import { InjectionToken } from '../di/provider.js';
import { inject } from '../di/inject.js';
import { Type } from '../utils/typeof.js';
import { HTMLComponent } from './custom-element.js';
import { OutputEventInit } from '../annotation/options.js';


export interface InputOptions<T, TransformT> {
	alias?: string;
	transform?: (v: TransformT) => T;
}

export type InputOptionsWithoutTransform<T> = Omit<InputOptions<T, T>, 'transform'>;

export type InputOptionsWithTransform<T, TransformT> = Required<Pick<InputOptions<T, TransformT>, 'transform'>> & InputOptions<T, TransformT>;

export interface InputWithTransform<T, TransformT = T> extends Signal<T> {
	options?: InputOptions<T, TransformT>;
}

export interface InputWithoutTransform<T> extends InputWithTransform<T, T> {
	options?: InputOptionsWithoutTransform<T>;
}

export class InputSignal<T, TransformT = T> extends Signal<T> implements InputWithoutTransform<T> {


	constructor(scope: SignalScope, index: number, initValue?: T, public options?: InputOptions<T, TransformT> & { required?: boolean }) {
		super(scope, index, initValue);
	}

	override set(value: T): void;
	override set(value: TransformT): void;
	override set(value: T | TransformT): void {
		if (this.options?.transform) {
			value = this.options.transform(value as TransformT);
		}
		super.set(value as T);
	}
}

export function isInputSignal<T = any>(signal: any): signal is InputSignal<T> {
	return signal instanceof InputSignal;
}

export function input<T>(): InputWithoutTransform<T>;
export function input<T, TransformT = T>(initValue: T, options: InputOptionsWithTransform<T, TransformT>): InputWithTransform<T, TransformT>;
export function input<T>(initValue: T, options?: InputOptionsWithoutTransform<T>): InputWithoutTransform<T>;
export function input<T, TransformT = T>(initValue?: T, options?: InputOptions<T, TransformT>): InputWithTransform<T, TransformT>;
export function input<T, TransformT = T>(initValue?: T, options?: InputOptions<T, TransformT>): InputWithTransform<T, TransformT> {
	options = Object.assign(options ?? {}, { required: false });
	return signalScopeFactory.factory((scope, index) => new InputSignal<T, TransformT>(scope, index, initValue, options));
}

function requiredInput<T, TransformT = T>(options?: InputOptions<T, TransformT>): InputWithTransform<T, TransformT> {
	options = Object.assign(options ?? {}, { required: true });
	return signalScopeFactory.factory((scope, index) => new InputSignal<T, TransformT>(scope, index, undefined, options));
}

input.required = requiredInput;

export class FormValueSignal<T> extends Signal<T> {

	constructor(scope: SignalScope, index: number, initValue?: T, public options?: { required?: boolean }) {
		super(scope, index, initValue);
	}

}

export function formValue<T>(initValue?: T): FormValueSignal<T> {
	return signalScopeFactory.factory((scope, index) => new FormValueSignal<T>(scope, index, initValue, { required: false }));
}

function requiredFormValue<T>(): FormValueSignal<T> {
	return signalScopeFactory.factory((scope, index) => new FormValueSignal<T>(scope, index, undefined, { required: true }));
}

formValue.required = requiredFormValue;

type OutputOption = OutputEventInit & { alias?: string };

export interface OutputSignal<T> extends Signal<T> {
	set: never;
	update: never;
}

export class OutputSignal<T> extends Signal<T> {

	constructor(scope: SignalScope, index: number, public options?: OutputOption) {
		super(scope, index);
	}

	emit(value: T) {
		this.scope.set(this.index, value);
	}
}

export function isOutputSignal<T = any>(signal: any): signal is OutputSignal<T> {
	return signal instanceof OutputSignal;
}

export function output<T>(options?: OutputOption): OutputSignal<T> {
	return signalScopeFactory.factory((scope, index) => new OutputSignal<T>(scope, index, options));
}

export const VIEW_TOKEN = new InjectionToken<HTMLElement>('VIEW');

export function view(): HTMLElement;
export function view<T extends keyof HTMLElementTagNameMap>(extend: T): HTMLElementTagNameMap[T];
export function view<T>(type: Type<T>): HTMLComponent<T>;
export function view<T, V extends keyof HTMLElementTagNameMap>(type: Type<T>, extend: V): HTMLComponent<T> & HTMLElementTagNameMap[V];
export function view(): any {
	return inject(VIEW_TOKEN)!;
}

export class ViewChildSignal<T> extends Signal<T> {

	constructor(scope: SignalScope, index: number, public selector: string | Type<T> | HTMLElement | keyof HTMLElementTagNameMap) {
		super(scope, index);
	}
}

export function isViewChildSignal<T = any>(signal: any): signal is ViewChildSignal<T> {
	return signal instanceof ViewChildSignal;
}

export function viewChild<T extends HTMLElement>(selector: Type<T>): Signal<T>;
export function viewChild<T>(selector: Type<T>): Signal<HTMLComponent<T>>;
export function viewChild<T extends keyof HTMLElementTagNameMap>(selector: T): Signal<HTMLElementTagNameMap[T]>;
export function viewChild<T extends HTMLElement>(templateName: string): Signal<T>;
export function viewChild<T>(selector: string | Type<T> | HTMLElement | keyof HTMLElementTagNameMap): Signal<T> {
	return signalScopeFactory.factory((scope, index) => new ViewChildSignal<T>(scope, index, selector));
}
