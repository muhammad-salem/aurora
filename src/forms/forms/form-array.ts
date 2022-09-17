import { AttributeDirective, Directive } from '@ibyar/core';
import { AbstractControl } from './form-control.js';


export abstract class AbstractFormArray<T> extends AbstractControl<T> {
	controls: AbstractControl<any>[];

}

export class FormArray<T> extends AbstractFormArray<T> {

}

@Directive({
	selector: 'formArray'
})
export class FormArrayDirective extends AttributeDirective {

}

@Directive({
	selector: 'formArrayName'
})
export class FormArrayNameDirective extends AttributeDirective {

}
