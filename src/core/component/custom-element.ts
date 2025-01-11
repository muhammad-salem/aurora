import type { ReactiveScope, ReactiveControlScope, Context, SignalScope } from '@ibyar/expressions';
import type { Type } from '../utils/typeof.js';
import { ComponentRef } from './component.js';
import { AuroraZone } from '../zone/zone.js';
import { PropertyRef } from './reflect.js';
import { InjectionProvider } from '../di/provider.js';
import { ChangeDetectorRef } from '../linker/change-detector-ref.js';
import { ComponentRender } from '../view/render.js';

export interface CustomElement {
	adoptedCallback(): void;
	attributeChangedCallback(name: string, oldValue: any, newValue: any): void;
	connectedCallback(): void;
	disconnectedCallback(): void;
}

export type ModelType<T> = T & Context;

export type NodeContextType<T> = { 'this': BaseComponent<T> };

export interface BaseComponent<T> extends CustomElement {

	_model: ModelType<T>;
	_modelScope: ReactiveControlScope<T & Context>;
	_signalScope: SignalScope;
	_viewScope: ReactiveScope<{ 'this': BaseComponent<T> }>;
	_zone: AuroraZone;
	_provider: InjectionProvider;
	_detector: ChangeDetectorRef;
	_render: ComponentRender<any>;

	getComponentRef(): ComponentRef<T>;
	getInput(viewProp: string): PropertyRef | undefined;
	getInputValue(viewProp: string): any;
	setInputValue(viewProp: string, value: any): void;

	onDestroy(callback: () => void): void;

}

export interface HTMLComponent<T> extends BaseComponent<T>, HTMLElement { }

export function isHTMLComponent(object: any): object is HTMLComponent<any> {
	return object instanceof HTMLElement && Reflect.has(object, '_model');
}

export function isHTMLComponentOfType<T extends object>(object: any, typeClass: Type<T>): object is HTMLComponent<T> {
	return isHTMLComponent(object)
		&& Reflect.get(object, '_model') instanceof typeClass;
}

export function isHTMLElement(element: HTMLElement): element is HTMLElement {
	return element && element instanceof HTMLElement && !element.tagName?.includes('-');
}

export function isHTMLUnknownElement(element: HTMLElement): element is HTMLElement {
	return element && element instanceof HTMLUnknownElement && !element.tagName?.includes('-');
}

/**
 * Lifecycle callbacks
 * A map, whose keys are the strings "connectedCallback", "disconnectedCallback", "adoptedCallback", "attributeChangedCallback", 
 * "formAssociatedCallback", "formDisabledCallback", "formResetCallback", and "formStateRestoreCallback" 
 * https://html.spec.whatwg.org/multipage/custom-elements.html#concept-custom-element-definition-lifecycle-callbacks
 * 
 * A form-associated custom element API includes a set of extra lifecycle callbacks to tie in to the form lifecycle.
 * The callbacks are optional: only implement a callback if your element needs to do something at that point in the lifecycle.
 * https://html.spec.whatwg.org/multipage/custom-elements.html#the-elementinternals-interface 
 * https://docs.google.com/document/d/1JO8puctCSpW-ZYGU8lF-h4FWRIDQNDVexzHoOQ2iQmY/edit
 */
export interface FormAssociatedCustomElement extends CustomElement {

	/**
	 * Called when the browser associates the element with a form element,
	 * or disassociates the element from a form element.
	 * @param form 
	 */
	formAssociatedCallback(form: HTMLFormElement | null): void;

	/**
	 * Called after the disabled state of the element changes,
	 * either because the disabled attribute of this element was added or removed;
	 * or because the disabled state changed on a <fieldset> that's an ancestor of this element.
	 * The disabled parameter represents the new disabled state of the element.
	 * The element may, for example, disable elements in its shadow DOM when it is disabled.
	 * @param disabled 
	 */
	formDisabledCallback(disabled: boolean): void;

	/**
	 * Called after the form is reset.
	 * The element should reset itself to some kind of default state.
	 * For <input> elements, this usually involves setting the value property to
	 * match the value attribute set in markup (or in the case of a checkbox,
	 * setting the checked property to match the checked attribute.
	 */
	formResetCallback(): void;

	/**
	 * Called in one of two circumstances:
	 * When the browser restores the state of the element (for example, after a navigation, or when the browser restarts).
	 *  The mode argument is "restore" in this case.
	 * 
	 * When the browser's input-assist features such as form auto filling sets a value.
	 *  The mode argument is "autocomplete" in this case.
	 * 
	 * The type of the first argument depends on how the setFormValue() method was called.
	 * For more details, see Restoring form state.
	 */
	formStateRestoreCallback(value: any, mode: 'restore' | 'autocomplete'): void;
}

export type WriteValueMode = 'restore' | 'autocomplete' | 'reset';

export type WriteValueOptions<T> = { value: T | null, mode?: 'restore' | 'autocomplete' } | { value?: undefined, mode: 'reset' };


export interface ValueControl<T = any> {
	/**
	 * reset the value of the
	 * @param value 
	 * @param mode 
	 */
	writeValue(opt: { value?: undefined, mode: 'reset' }): void;

	/**
	 * 
	 * When the browser restores the state of the element (for example, after a navigation, or when the browser restarts).
	 *  The mode argument is "restore" in this case.
	 * 
	 * When the browser's input-assist features such as form auto filling sets a value.
	 *  The mode argument is "autocomplete" in this case.
	 * 
	 * @param opt:  options contain the `value` to be written and `mode` represented by `restore` or `autocomplete` or `undefined`
	 */

	writeValue(opt: { value: T | null, mode?: 'restore' | 'autocomplete' }): void;

	writeValue(opt: { value?: T | null, mode?: WriteValueMode }): void;

	writeValue(opt: WriteValueOptions<T>): void;

	/**
	 * This method is called when new `ValueControl` assigned to the form associated element.
	 * 
	 * When implementing the registerOnChange method in your own value accessor, save the given function so your class calls it at the appropriate time.
	 * 
	 * ```ts
	 * registerOnChange(fn: (_: any) => void): void {
	 * 	this._onChange = fn;
	 * }
	 * ```
	 * 
	 * When the value changes in the UI, call the registered function to allow the forms API to update itself:
	 * 
	 * ```ts
	 * 
	 * onChange(event: Event){
	 * 	
	 * }
	 * 
	 * ```
	 * @param fn the function to be called when a control want to change the value of a form associated element.
	 */

	registerOnChange(fn: (value?: T | null) => void): void;

	/**
	 * called when `disabled` attribute change.
	 * @param isDisabled 
	 */
	setDisabledState?(isDisabled: boolean): void;
}

export function isValueControl(obj: any): obj is ValueControl {
	return obj
		&& typeof obj === 'object'
		&& typeof obj.writeValue === 'function'
		&& typeof obj.registerOnChange === 'function';
}

export interface BaseFormAssociatedComponent<T extends Object> extends BaseComponent<T>, FormAssociatedCustomElement {
	readonly internals: ElementInternals;
	readonly form: HTMLFormElement | null;
	readonly valueControl?: ValueControl<T>;

	registerValueControl(valueControl: ValueControl): void;
}

export interface FormAssociatedComponent<T extends Object, V = any> extends BaseFormAssociatedComponent<T>, HTMLComponent<T> {

	value: V | null;
}

export type HTMLFormElement = HTMLButtonElement | HTMLDataListElement | HTMLFieldSetElement | HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;


export interface ConstructorOfView<T> {
	new(): T;
	readonly prototype: T;
}
