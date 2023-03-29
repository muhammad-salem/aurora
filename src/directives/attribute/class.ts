import { AttributeDirective, Directive, Input } from '@ibyar/core';


class DOMTokenListProxyHandler implements ProxyHandler<DOMTokenList> {

	get(target: DOMTokenList, className: string) {
		return target.contains(className);
	}

	set(target: DOMTokenList, className: string, newValue: boolean): boolean {
		if (newValue) {
			target.add(className);
		} else {
			target.remove(className);
		}
		return true;
	}

}

const handler = new DOMTokenListProxyHandler();

@Directive({
	selector: 'class'
})
export class ClassDirective extends AttributeDirective {

	private proxy?: DOMTokenList;

	@Input('class')
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
		return (this.proxy ??= new Proxy(this.el.classList, handler)) as any;
	}

	private updateClassList(add?: string[], remove?: string[]) {
		remove && this.el.classList.remove(...remove);
		add && this.el.classList.add(...add);
	}

}
