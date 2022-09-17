import { AttributeDirective, Directive } from '@ibyar/core';
import type { AsyncValidator, Validator } from './validators.js';

export abstract class AbstractControl<T> {
	value: T | null;
	validator?: Validator[] | null;
	asyncValidators?: AsyncValidator[] | null;
	errors?: { [key: string]: any } | null;
}


@Directive({
	selector: 'formControl'
})
export class FormControlDirective extends AttributeDirective {


}

@Directive({
	selector: 'formControlName'
})
export class FormControlNameDirective extends AttributeDirective {


}
