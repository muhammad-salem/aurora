import { AttributeDirective, Directive, Input, OnInit } from '@ibyar/core';

@Directive({
	selector: 'class'
})
export class ClassDirective extends AttributeDirective implements OnInit {
	private updater: (add?: string[] | undefined, remove?: string[] | undefined) => void = this.updateClassList;

	onInit(): void {
		this.updater = typeof requestAnimationFrame == 'function'
			? this.requestClassAnimationFrame
			: this.updateClassList;
	}

	@Input('class')
	set 'class'(className: string | Array<string> | { [className: string]: boolean }) {
		if (typeof className === 'string') {
			const add = className.split(/[ ]{1,}/);
			this.updater(add);
		} else if (Array.isArray(className)) {
			this.updater(className);
		} else if (typeof className === 'object') {
			const keys = Object.keys(className);
			const add = keys.filter(key => className[key]);
			const remove = keys.filter(key => !className[key]);
			this.updater(add, remove);
		}
	}
	get 'class'() {
		return this.el.classList.value;
	}

	private updateClassList(add?: string[], remove?: string[]) {
		remove && this.el.classList.remove(...remove);
		add && this.el.classList.add(...add);
	}

	private requestClassAnimationFrame(add?: string[], remove?: string[]) {
		requestAnimationFrame(() => this.updateClassList(add, remove));
	}

}
