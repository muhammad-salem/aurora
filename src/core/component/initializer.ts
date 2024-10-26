import {
	getReactiveNode, ReactiveSignal,
	ScopeSubscription, WritableSignal
} from '@ibyar/expressions';
import { signalScopeFactory } from '../signals/factory.js';
import { OutputEventEmitter } from './events.js';
import { InjectionToken } from '../di/provider.js';
import { inject } from '../di/inject.js';


export interface InputOptions<T, TransformT> {
	alias?: string;
	transform?: (v: TransformT) => T;
}

export type InputOptionsWithoutTransform<T> = Omit<InputOptions<T, T>, 'transform'> & { transform?: undefined }

export type InputOptionsWithTransform<T, TransformT> = Required<Pick<InputOptions<T, TransformT>, 'transform'>> & InputOptions<T, TransformT>;

export interface InputSignalWithTransform<T, TransformT> extends ReactiveSignal<T> {

}

export interface InputSignal<T, TransformT = T> extends InputSignalWithTransform<T, TransformT> {

}

export function input<T>(): InputSignal<T>;
export function input<T>(initialValue: T, opts?: InputOptionsWithoutTransform<T>): InputSignal<T>;
export function input<T, TransformT = T>(initialValue: T, opts: InputOptionsWithTransform<T, TransformT>): InputSignalWithTransform<T, TransformT>;
export function input<T, TransformT = T>(initialValue?: T, opts?: InputOptions<T, TransformT>): InputSignal<T, TransformT>;
export function input<T, TransformT = T>(initialValue?: T, opts?: InputOptions<T, TransformT>): InputSignal<T, TransformT> {
	const signal = signalScopeFactory.signal(initialValue);
	if (opts?.transform) {
		const setOriginal = signal.set;
		signal.set = (value: T): void => setOriginal(opts!.transform!(value as any as TransformT));
	};
	return signal as InputSignal<T, TransformT>;
}

function requiredInput<T>(): InputSignal<T>;
function requiredInput<T>(opts?: InputOptionsWithoutTransform<T>): InputSignal<T>;
function requiredInput<T, TransformT = T>(opts: InputOptionsWithTransform<T, TransformT>): InputSignalWithTransform<T, TransformT>;
function requiredInput<T, TransformT = T>(opts?: InputOptions<T, TransformT>): InputSignal<T, TransformT> {
	return input(undefined as T, opts);
}

input.required = requiredInput;


type OutputOption = EventInit & { alias?: string };

export function output<T>(opts?: OutputOption): OutputEventEmitter<T> {
	return new OutputEventEmitter<T>(opts);
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
	const signal = signalScopeFactory.signal(undefined) as ModelSignal<T>;
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

export function view<T extends HTMLElement>(): T {
	return inject<T>(VIEW_TOKEN) as T;
}
