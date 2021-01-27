import type { TypeOf } from '../utils/typeof.js';
import { ComponentRef } from '../component/component.js';
import { CustomFormElement, HTMLFormElement, HTMLFormElementComponent } from '../component/custom-element.js';
import { baseFactoryView } from './base-view.js';

export function baseFormFactoryView<T extends Object>(htmlElementType: TypeOf<HTMLElement>): TypeOf<HTMLFormElementComponent<T>> {
    let baseViewClass = baseFactoryView<T>(htmlElementType);
    class BaseFormView<T> extends baseViewClass implements CustomFormElement {

        // Identify the element as a form-associated custom element
        static formAssociated = true;

        _disabled: boolean;
        _required: boolean;
        _value: any;

        // private internals_: ElementInternals;
        constructor(componentRef: ComponentRef<T>, modelClass: TypeOf<T>) {
            super(componentRef, modelClass);
            // this.internals_ = this.attachInternals();
        }

        formAssociatedCallback(form: HTMLFormElement): void {
            throw new Error('Method not implemented.');
        }
        formDisabledCallback(disabled: boolean): void {
            throw new Error('Method not implemented.');
        }
        formResetCallback(): void {
            throw new Error('Method not implemented.');
        }
        formStateRestoreCallback(value: any, mode: 'restore' | 'autocomplete'): void {
            throw new Error('Method not implemented.');
        }

        // get form() { return this.internals_.form; }
        // get name() { return this.getAttribute('name'); }
        // get type() { return this.localName; }
        // get validity() { return this.internals_.validity; }
        // get validationMessage() { return this.internals_.validationMessage; }
        // get willValidate() { return this.internals_.willValidate; }

        // checkValidity() { return this.internals_.checkValidity(); }
        // reportValidity() { return this.internals_.reportValidity(); }

        set disabled(disabled) {
            this._disabled = disabled;
            this.toggleAttribute('disabled', disabled);
        }

        get disabled() {
            return this._disabled;
        }

        set required(required) {
            this._required = required;
            this.toggleAttribute('required', required);
            // if (!this.value) {
            //     this.internals.setValidity({
            //         valueMissing: true
            //     }, 'This field is required');
            // } else {
            //     this.internals.setValidity({
            //         valueMissing: false
            //     });
            // }
        }

        get required() {
            return this._required;
        }

        set value(value: any) {
            this._value = value;
            // this.internals.setFormValue(value);
        }

        get value() {
            return this._value;
        }
    }
    return BaseFormView;
}
