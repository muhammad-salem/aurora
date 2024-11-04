import {
	getReactiveNode,
	ScopeSubscription,
	Signal, WritableSignal
} from '@ibyar/expressions';
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
	options?: InputOptions<T, TransformT>;

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
export function input<T>(initialValue: T, opts?: InputOptionsWithoutTransform<T>): InputWithoutTransform<T>;
export function input<T, TransformT = T>(initialValue: T, opts: InputOptionsWithTransform<T, TransformT>): InputWithTransform<T, TransformT>;
export function input<T, TransformT = T>(initialValue?: T, opts?: InputOptions<T, TransformT>): InputWithTransform<T, TransformT>;
export function input<T, TransformT = T>(initialValue?: T, opts?: InputOptions<T, TransformT>): InputWithTransform<T, TransformT> {
	const signal = signalScopeFactory.signal(initialValue, InputSignal) as InputSignal<T, TransformT>;
	signal.options = opts;
	return signal;
}

function requiredInput<T>(): InputWithoutTransform<T>;
function requiredInput<T>(opts?: InputOptionsWithoutTransform<T>): InputWithoutTransform<T>;
function requiredInput<T, TransformT = T>(opts: InputOptionsWithTransform<T, TransformT>): InputWithTransform<T, TransformT>;
function requiredInput<T, TransformT = T>(opts?: InputOptions<T, TransformT>): InputWithTransform<T, TransformT> {
	return input(undefined as T, opts);
}

input.required = requiredInput;


type OutputOption = OutputEventInit & { alias?: string };



export interface OutputSignal<T> extends Signal<T> {
	set: never;
	update: never;
}

export class OutputSignal<T> extends Signal<T> {
	public options?: OutputOption;

	emit(value: T) {
		this.scope.set(this.index, value);
	}
}


export function isOutputSignal<T = any>(signal: any): signal is OutputSignal<T> {
	return signal instanceof OutputSignal;
}

export function output<T>(opts?: OutputOption): OutputSignal<T> {
	const signal = signalScopeFactory.signal(undefined, OutputSignal) as OutputSignal<T>;
	signal.options = opts;
	return signal;
}

interface ModelOptions {
	alias?: string;
}

export interface ModelSignal<T> extends WritableSignal<T> {
	subscribe(callback: (value: T) => void): ScopeSubscription<T>;
}

export function model<T>(): ModelSignal<T>;
export function model<T>(opts?: ModelOptions): ModelSignal<T>;
export function model<T>(opts?: ModelOptions): ModelSignal<T> {
	const signal = signalScopeFactory.signalFn(undefined) as ModelSignal<T>;
	const node = getReactiveNode(signal);
	if (node) {
		signal.subscribe = node.subscribe.bind(signal);
	}
	return signal;
}

function requiredModel<T>(): ModelSignal<T>;
function requiredModel<T>(opts?: ModelOptions): ModelSignal<T> {
	return model(opts);
}

model.required = requiredModel;


export const VIEW_TOKEN = new InjectionToken<HTMLElement>('VIEW');


export function view(): HTMLElement;
export function view<T extends keyof HTMLElementTagNameMap>(extend: T): HTMLElementTagNameMap[T];
export function view<T>(type: Type<T>): HTMLComponent<T>;
export function view<T, V extends keyof HTMLElementTagNameMap>(type: Type<T>, extend: V): HTMLComponent<T> & HTMLElementTagNameMap[V];
export function view(): any {
	return inject(VIEW_TOKEN)!;
}


export class ViewChildSignal<T> extends Signal<T> {
	public selector: string | Type<T> | HTMLElement | keyof HTMLElementTagNameMap;
}

export function isViewChildSignal<T = any>(signal: any): signal is ViewChildSignal<T> {
	return signal instanceof ViewChildSignal;
}

export function viewChild<T extends HTMLElement>(selector: Type<T>): Signal<T>;
export function viewChild<T>(selector: Type<T>): Signal<HTMLComponent<T>>;
export function viewChild<T extends keyof HTMLElementTagNameMap>(selector: T): Signal<HTMLElementTagNameMap[T]>;
export function viewChild<T extends HTMLElement>(selector: string): Signal<T>;
export function viewChild<T>(selector: string | Type<T> | HTMLElement | keyof HTMLElementTagNameMap): Signal<T> {
	const signal = signalScopeFactory.signal(undefined, ViewChildSignal) as ViewChildSignal<T>;
	signal.selector = selector;
	return signal;
}
