import type { TypeOf } from '../utils/typeof';
import { EventEmitter } from './events';
import { PropertyRef, ComponentRef } from './component';
import { Model } from '../model/change-detection';

export interface CustomElement {
	adoptedCallback(): void;
	attributeChangedCallback(name: string, oldValue: any, newValue: any): void;
	connectedCallback(): void;
	disconnectedCallback(): void;
}

export interface BaseComponent<T extends Object> extends CustomElement {

	_model: T & Model & { [key: string]: any };

	getComponentRef(): ComponentRef<T>;

	setParentComponent<V>(parent: HTMLComponent<V>): void;
	getParentComponent<V>(): HTMLComponent<V>;
	hasParentComponent(): boolean;

	hasInputStartWith(viewProp: string): boolean;
	getInputStartWith(viewProp: string): PropertyRef | undefined;
	getInput(viewProp: string): PropertyRef | undefined;
	getInputValue(viewProp: string): any;
	setInputValue(viewProp: string, value: any): void;

	hasInput(viewProp: string): boolean;
	hasProp(propName: string): boolean;
	hasOutput(viewProp: string): boolean;

	getOutput(viewProp: string): PropertyRef | undefined;
	getEventEmitter<V>(viewProp: string): EventEmitter<V> | undefined;

	triggerOutput(eventName: string, value?: any): void;
	triggerModelChange(eventName: string, value?: any, source?: HTMLElement): void;
	emitRootChanges(): void;
	emitChanges(...events: string[]): void;

}

export interface HTMLComponent<T extends Object> extends BaseComponent<T>, HTMLElement { }

export function isHTMLComponent(object: any): object is HTMLComponent<any> {
	return Reflect.has(object, '_model')
		&& object instanceof HTMLElement;
}

export function isHTMLComponentOfType(object: any, typeClass: TypeOf<Object>): object is HTMLComponent<any> {
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
export interface CustomFormElement extends CustomElement {

	/**
	 * Called when the browser associates the element with a form element,
	 * or disassociates the element from a form element.
	 * @param form 
	 */
	formAssociatedCallback(form: HTMLFormElement): void;

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
	 * When the browser's input-assist features such as form autofilling sets a value.
	 *  The mode argument is "autocomplete" in this case.
	 * 
	 * The type of the first argument depends on how the setFormValue() method was called.
	 * For more details, see Restoring form state.
	 */
	formStateRestoreCallback(value: any, mode: 'restore' | 'autocomplete'): void;
}

export interface BaseFormElementComponent<T extends Object> extends BaseComponent<T>, CustomFormElement { }

export interface HTMLFormElementComponent<T extends Object> extends BaseFormElementComponent<T>, HTMLComponent<T> { }

export type HTMLFormElement = HTMLButtonElement | HTMLDataListElement | HTMLFieldSetElement | HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
