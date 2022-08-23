import type { TypeOf } from '../utils/typeof.js';
import { ComponentRef } from '../component/component.js';
import {
	FormAssociatedCustomElement, HTMLFormElement,
	FormAssociatedComponent,
	ValueControl,
	isValueControl,
} from '../component/custom-element.js';
import { baseFactoryView } from './base-view.js';

export const NOOP_CONTROL_CHANGE = () => { };


export function baseFormFactoryView<T extends Object>(htmlElementType: TypeOf<HTMLElement>): TypeOf<FormAssociatedComponent<T>> {
	const baseViewClass = baseFactoryView<T>(htmlElementType);
	class BaseFormView<T> extends baseViewClass implements FormAssociatedCustomElement {

		/**
		 * Identify the element as a form-associated custom element
		 */
		static formAssociated = true;

		private _internals: ElementInternals;
		private _form: HTMLFormElement | null;
		private _valueControl?: ValueControl<T>;

		constructor(componentRef: ComponentRef<T>, modelClass: TypeOf<T>) {
			super(componentRef, modelClass);
			this._internals = this.attachInternals();
			let valueControl: ValueControl<any> | undefined;
			if (typeof componentRef.formAssociated === 'function') {
				if (this._model instanceof componentRef.formAssociated) {
					valueControl == this._model;
				} else {
					const args: any[] = []; /* resolve dependency injection*/;
					valueControl = new componentRef.formAssociated(args);
				}
			} else if (componentRef.formAssociated === true && isValueControl(this._model)) {
				valueControl == this._model;
			}
			valueControl && this.registerValueControl(valueControl);
		}
		get internals(): ElementInternals {
			return this._internals;
		}
		get form(): HTMLFormElement | null {
			return this._form;
		}
		get valueControl(): ValueControl<T> | undefined {
			return this._valueControl;
		}
		registerValueControl(valueControl: ValueControl): void {
			if (this.valueControl) {
				this.valueControl.registerOnChange(NOOP_CONTROL_CHANGE);
			}
			this._valueControl = valueControl;
			this._valueControl?.registerOnChange((value: any) => {
				this._internals.setFormValue(value);
				const event = new CustomEvent(
					'change',
					{
						detail: value,
						cancelable: false,
						bubbles: true,
					},
				);
				this.dispatchEvent(event);
			});
		}

		formAssociatedCallback(form: HTMLFormElement | null): void {
			this._form = form;
		}
		formDisabledCallback(disabled: boolean): void {
			this._valueControl?.setDisabledState?.(disabled);
		}
		formResetCallback(): void {
			this._valueControl?.writeValue({ mode: 'reset' });
		}
		formStateRestoreCallback(value: any, mode: 'restore' | 'autocomplete'): void {
			this._valueControl?.writeValue({ value, mode });
		}
	}
	return BaseFormView;
}
