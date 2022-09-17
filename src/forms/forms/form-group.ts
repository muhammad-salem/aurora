import { AttributeDirective, Directive } from '@ibyar/core';
import { AbstractControl } from './form-control.js';


export abstract class AbstractFormGroup<T> extends AbstractControl<T> {
	controls: AbstractControl<any>[];

}

export class FormGroup<T> extends AbstractFormGroup<T> {

}


@Directive({
	selector: 'formGroup'
})
export class FormGroupDirective extends AttributeDirective {


}
