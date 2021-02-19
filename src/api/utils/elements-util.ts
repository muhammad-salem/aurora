import { hasNativeAttr } from '@ibyar/element';
import { ComponentRef } from '../component/component.js';
import { isHTMLComponent } from '../component/custom-element.js';

export function hasComponentAttr(element: HTMLElement, attr: string): boolean {
	if (isHTMLComponent(element)) {
		var componentRef: ComponentRef<any> = element.getComponentRef();
		return componentRef.inputs.some(input => input.viewAttribute === attr);
	}
	return false;
}

export function hasAttr(element: HTMLElement, attr: string): boolean {
	return hasNativeAttr(element, attr) || hasComponentAttr(element, attr);
}
