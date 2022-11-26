import { FormArray } from '../forms/form-array.js';
import { AbstractControl, FormControl } from '../forms/form-control.js';
import { FormGroup } from '../forms/form-group.js';
import { AsyncValidator, Validator } from '../forms/validators.js';

export type ControlOptions = { validators?: Validator | Validator[], asyncValidators?: AsyncValidator | AsyncValidator[] }

export type ControlValue<T = any> = { value?: T | null, disabled: boolean };

export function isControlValue<T>(ref: any): ref is ControlValue<T> {
	return ref.value || ref.disabled;
}

export class FormBuilder {

	public control<T>(value?: T | ControlValue<T> | null, options?: ControlOptions): FormControl<T> {
		const { value: controlValue, disabled } = isControlValue(value)
			? value
			: { value, disabled: false };
		const formControl = new FormControl<T>(controlValue, disabled);
		this.initValidators(formControl, options);
		return formControl;
	}

	public group<T extends { [K in keyof T]: AbstractControl<any>; } = any>(group: Record<keyof T, T[keyof T] | ControlValue<T[keyof T]> | FormControl<T[keyof T]>>, options?: ControlOptions): FormGroup<T> {
		const formGroup = new FormGroup<T>();
		this.initValidators(formGroup, options);
		(Object.keys(group) as (keyof T & string)[]).forEach(key => {
			formGroup.addControl(key, this.createControl(group[key]));
		});
		return formGroup;
	}

	public array<T extends AbstractControl<any> = any>(array: AbstractControl<T[keyof T]>[], options?: ControlOptions): FormArray<T> {
		const formArray = new FormArray<T>();
		this.initValidators(formArray, options);
		array.forEach(control => formArray.push(this.createControl(control)));
		return formArray;
	}

	private createControl(item: AbstractControl<any> | Record<string, any> | any) {
		if (item instanceof AbstractControl) {
			return item;
		} else if (typeof item !== 'object') {
			return this.control(item);
		} else if (Array.isArray(item)) {
			return this.array(item);
		}
		return this.group(item);
	}

	private initValidators(control: AbstractControl<any>, options?: ControlOptions) {
		if (!options) {
			return;
		}
		const validators = this.getSafeArrayValue(options.validators);
		const asyncValidators = this.getSafeArrayValue(options.asyncValidators);
		validators.forEach(validator => control.addValidator(validator));
		asyncValidators.forEach(validator => control.addAsyncValidator(validator));
	}

	private getSafeArrayValue<T>(object?: T | T[] | null): T[] {
		return Array.isArray(object)
			? object
			: typeof object === 'object' && object !== null ? [object] : [];
	}

}
