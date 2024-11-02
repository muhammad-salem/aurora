import { Injectable } from '@ibyar/core';
import { ArrayControls, FormArray } from '../forms/form-array.js';
import { AbstractControl, FormControl } from '../forms/form-control.js';
import { FormGroup, GroupeControls } from '../forms/form-group.js';
import { ControlOptions, ControlValue, isControlValue } from './types.js';


@Injectable({ provideIn: 'root' })
export class FormBuilder {

	public control<T>(value?: T | ControlValue<T> | null, options?: ControlOptions): FormControl<T> {
		const { value: controlValue, disabled } = isControlValue(value) ? value : { value, disabled: false };
		const formControl = new FormControl<T>(controlValue, disabled);
		this.initValidators(formControl, options);
		return formControl;
	}

	public group<T>(controls: GroupeControls<T>, options?: ControlOptions): FormGroup<T> {
		const formGroup = new FormGroup<T>(controls);
		this.initValidators(formGroup, options);
		return formGroup;
	}

	public array<T>(controls: ArrayControls<T>, options?: ControlOptions): FormArray<T> {
		const formArray = new FormArray<T>(controls);
		this.initValidators(formArray, options);
		return formArray;
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
