import { ReactiveSignal } from '@ibyar/expressions';
import { signalScopeFactory } from '../signals/factory.js';
import { OutputEventEmitter } from './events.js';


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
export function input<T, TransformT = T>(initialValue?: T, opts?: InputOptions<T, TransformT>): InputSignal<T, TransformT> {
	const signal = signalScopeFactory.signal(initialValue);
	if (opts?.transform) {
		const setOriginal = signal.set;
		signal.set = (value: T): void => setOriginal(opts!.transform!(value as any as TransformT));
	};
	return signal as InputSignal<T, TransformT>;
}

function required<T>(): InputSignal<T>;
function required<T>(opts?: InputOptionsWithoutTransform<T>): InputSignal<T>;
function required<T, TransformT = T>(opts: InputOptionsWithTransform<T, TransformT>): InputSignalWithTransform<T, TransformT>;
function required<T, TransformT = T>(opts?: InputOptions<T, TransformT>): InputSignal<T, TransformT> {
	return input(undefined as T, opts as InputOptionsWithTransform<T, TransformT>);
}

input.required = required;


type OutputOption = EventInit & { alias?: string };

export function output<T>(opts?: OutputOption): OutputEventEmitter<T> {
	return new OutputEventEmitter<T>(opts);
}
