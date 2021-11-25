import { hasNativeAttr } from '@ibyar/elements';
import { ComponentRef } from '../component/component.js';
import { isHTMLComponent } from '../component/custom-element.js';

export function hasComponentAttr(element: HTMLElement, attr: string): boolean {
	if (isHTMLComponent(element)) {
		var componentRef: ComponentRef<any> = element.getComponentRef();
		return componentRef.inputs.some(input => input.viewAttribute === attr);
	}
	return false;
}

export function hasAttrCustomElement(element: HTMLElement, attr: string): boolean {
	if (Reflect.has(element.constructor, 'allAttributes')) {
		return Reflect.get(element.constructor, 'allAttributes').some((prop: string) => prop === attr);
	}
	else if (Reflect.has(element.constructor, 'observedAttributes')) {
		return Reflect.get(element.constructor, 'observedAttributes').some((prop: string) => prop === attr);
	}
	return false;
}

export function hasAttr(element: HTMLElement, attr: string): boolean {
	return hasNativeAttr(element, attr) || hasAttrCustomElement(element, attr) || hasComponentAttr(element, attr);
}
