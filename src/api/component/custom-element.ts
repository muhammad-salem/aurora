import { EventEmitter } from './events.js';
import { PropertyRef, ComponentRef } from './component.js';
import { Model } from '../model/change-detection.js';
import { TypeOf } from '../utils/types.js';

export interface CustomElement {
	attributeChangedCallback(name: string, oldValue: string, newValue: string): void;
	connectedCallback(): void;
	disconnectedCallback(): void;
	adoptedCallback(): void;
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