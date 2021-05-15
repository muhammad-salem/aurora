import { AttributeDirective, Directive, Input } from '@ibyar/core';

@Directive({
	selector: 'class'
})
export class ClassDirective extends AttributeDirective {

	@Input('class')
	set 'class'(className: string | Array<string> | { [className: string]: boolean }) {
		if (typeof className === 'string') {
			this.el.classList.add(...className.split(' '));
		} else if (Array.isArray(className)) {
			this.el.classList.add(...className);
		} else if (typeof className === 'object') {
			for (var name in className) {
				if (className[name]) {
					this.el.classList.add(name);
				} else {
					this.el.classList.remove(name);
				}
			}
		}
	}
	get 'class'() {
		return this.el.classList.value;
	}

}
