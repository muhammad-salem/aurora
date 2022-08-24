import type { TypeOf } from '../utils/typeof.js';
import { ComponentRef } from '../component/component.js';
import {
	FormAssociatedCustomElement, HTMLFormElement,
	FormAssociatedComponent,
	ValueControl,
	isValueControl,
} from '../component/custom-element.js';
import { baseFactoryView } from './base-view.js';
import { ARIAMixinAttributes, isFormElement } from '@ibyar/elements';

export const NOOP_CONTROL_CHANGE = () => { };


export function baseFormFactoryView<T extends Object>(htmlElementType: TypeOf<HTMLElement>): TypeOf<FormAssociatedComponent<T, any>> {
	const baseViewClass = baseFactoryView<T>(htmlElementType);
	class BaseFormView<T> extends baseViewClass implements FormAssociatedCustomElement {

		/**
		 * Identify the element as a form-associated custom element
		 */
		static formAssociated = true;

		value: any;

		private _internals: ElementInternals;
		private _form: HTMLFormElement | null;
		private _valueControl?: ValueControl<T>;

		constructor(componentRef: ComponentRef<T>, modelClass: TypeOf<T>) {
			super(componentRef, modelClass);
			if (componentRef.extend.name && isFormElement(componentRef.extend.name)) {
				this._internals = createNativeElementInternals(this);
			} else {
				this._internals = this.attachInternals();
			}
			let valueControl: ValueControl<any> | undefined;
			if (typeof componentRef.formAssociated === 'function') {
				if (this._model instanceof componentRef.formAssociated) {
					valueControl == this._model;
				} else {
					const args: any[] = [this]; /* resolve dependency injection*/;
					valueControl = new componentRef.formAssociated(args);
				}
			} else if (componentRef.formAssociated === true && isValueControl(this._model)) {
				valueControl = this._model;
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
				this.value = value;
				this.dispatchEvent(new Event('change'));
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
function createNativeElementInternals(input: FormAssociatedComponent<any, any>): ElementInternals {
	const el = input as any as HTMLInputElement;
	const internals = {} as ElementInternals;
	Object.defineProperty(internals, 'form', {
		get: () => el.form,
	});
	Object.defineProperty(internals, 'labels', {
		get: () => el.labels,
	});
	Object.defineProperty(internals, 'shadowRoot', {
		get: () => el.shadowRoot,
	});

	Object.defineProperty(internals, 'willValidate', {
		get: () => el.willValidate,
	});
	Object.defineProperty(internals, 'setFormValue', {
		value: (value: any) => el.value = value,
	});
	ARIAMixinAttributes.forEach(ariaName => {
		Object.defineProperty(internals, ariaName, {
			get: () => el[ariaName],
			set: value => el[ariaName] = value,
		});
	});
	return internals;
}
