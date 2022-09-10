import { AttributeDirective, Directive, Input } from '@ibyar/core';

@Directive({
	selector: 'formGroup'
})
export class FormGroupDirective extends AttributeDirective {

	@Input('formGroup')
	set 'class'(className: string | Array<string> | { [className: string]: boolean }) {
		if (typeof className === 'string') {
			const add = className.split(/[ ]{1,}/);
			this.updateClassList(add);
		} else if (Array.isArray(className)) {
			this.updateClassList(className);
		} else if (typeof className === 'object') {
			const keys = Object.keys(className);
			const add = keys.filter(key => className[key]);
			const remove = keys.filter(key => !className[key]);
			this.updateClassList(add, remove);
		}
	}
	get 'class'() {
		return this.el.classList.value;
	}

	private updateClassList(add?: string[], remove?: string[]) {
		remove && this.el.classList.remove(...remove);
		add && this.el.classList.add(...add);
	}

}
