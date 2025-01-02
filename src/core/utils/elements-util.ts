import { hasNativeAttr } from '@ibyar/elements';


export function hasAttrCustomElement(element: HTMLElement, attr: string): boolean {
	if (Reflect.has(element.constructor, 'allAttributes')) {
		return Reflect.get(element.constructor, 'allAttributes').some((prop: string) => prop === attr);
	}
	else if (Reflect.has(element.constructor, 'observedAttributes')) {
		return Reflect.get(element.constructor, 'observedAttributes').some((prop: string) => prop === attr);
	}
	return false;
}

export function isDataAttributes(attr: string) {
	return attr.startsWith('data-');
}

export function hasAttr(element: HTMLElement, attr: string): boolean {
	return hasNativeAttr(element, attr)
		|| hasAttrCustomElement(element, attr)
		|| isDataAttributes(attr);
}
