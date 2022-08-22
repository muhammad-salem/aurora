/**
 * https://html.spec.whatwg.org/multipage/forms.html
 */

import { isValidCustomElementName } from './tags.js';


/**
 * check the formAssociated property on the associated constructor. 
 * @param tagName tag name of the defined custom element
 * @returns boolean
 */
export function isFormAssociatedCustomElementByTag(tagName: string) {
	return !!(customElements.get(tagName) as (CustomElementConstructor & { formAssociated: boolean }) | undefined)?.formAssociated;
}

/**
 * check the formAssociated property on the associated constructor. 
 * @param constructor the associated constructor
 * @returns boolean
 */
export function isFormAssociatedCustomElementByConstructor(constructor: CustomElementConstructor) {
	return !!(constructor as (CustomElementConstructor & { formAssociated: boolean }) | undefined)?.formAssociated;
}

/**
 * check the formAssociated property on the associated constructor on already created element. 
 * @param el the element
 * @returns boolean
 */
export function isFormAssociatedCustomElementByElement(el: HTMLElement) {
	return el?.constructor && isFormAssociatedCustomElementByConstructor(el.constructor as CustomElementConstructor);
}

export function isFormAssociatedCustomElement(item: string | CustomElementConstructor | HTMLElement) {
	return typeof item === 'string'
		? isFormAssociatedCustomElementByTag(item)
		: typeof item === 'function'
			? isFormAssociatedCustomElementByConstructor(item)
			: isFormAssociatedCustomElementByElement(item);
}

/**
 *  form-associated elements
 * A number of the elements are form-associated elements, which means they can have a form owner.
 * @param tagName 
 */
export function isFormElement(tagName: string): boolean {
	switch (tagName) {
		case 'button':
		case 'datalist':
		case 'fieldset':
		case 'input':
		case 'label':
		case 'legend':
		case 'meter':
		case 'optgroup':
		case 'option':
		case 'output':
		case 'progress':
		case 'select':
		case 'textarea':
		default:
			break;
	}
	if (isValidCustomElementName(tagName)) {
		return isFormAssociatedCustomElementByTag(tagName);
	}
	return false;
}

/**
 * Denotes elements that are listed in the form.elements and fieldset.elements APIs.
 * These elements also have a form content attribute, and a matching form IDL attribute,
 * that allow authors to specify an explicit form owner.
 * @param tagName 
 */
export function isListedFormElement(tagName: string): boolean {
	switch (tagName) {
		case 'button':
		case 'fieldset':
		case 'input':
		case 'object':
		case 'output':
		case 'select':
		case 'textarea':
			return true;
		default:
			break;
	}
	if (isValidCustomElementName(tagName)) {
		return isFormAssociatedCustomElementByTag(tagName);
	}
	return false;
}

/**
 * submittable elements
 * Denotes elements that can be used for constructing the entry list when a form element is submitted.
 * @param tagName 
 */
export function isSubmittableElement(tagName: string): boolean {
	switch (tagName) {
		case 'button':
		case 'input':
		case 'object':
		case 'select':
		case 'textarea':
			return true;
		default:
			break;
	}
	if (isValidCustomElementName(tagName)) {
		return isFormAssociatedCustomElementByTag(tagName);
	}
	return false;
}

/**
 * Resettable elements
 * Denotes elements that can be affected when a form element is reset.
 * @param tagName 
 * @returns 
 */
export function isResettableElement(tagName: string): boolean {
	switch (tagName) {
		case 'input':
		case 'output':
		case 'select':
		case 'textarea':
			return true;
		default:
			break;
	}
	if (isValidCustomElementName(tagName)) {
		return isFormAssociatedCustomElementByTag(tagName);
	}
	return false;
}


/**
 * Autocapitalize-inheriting elements
 * Denotes elements that inherit the autocapitalize attribute from their form owner.
 * @param tagName 
 */
export function isAutocapitalizeInheritingElement(tagName: string): boolean {
	switch (tagName) {
		case 'button':
		case 'fieldset':
		case 'input':
		case 'output':
		case 'select':
		case 'textarea':
			return true;
		default: return false;
	}
}

/**
 * Label-able Elements
 * Some elements, not all of them form-associated, are categorized as label-able elements.
 * These are elements that can be associated with a label element.
 * 
 * this function ignore the 'type' attribute of 'input' tag as '<input type="hidden" />' is considered as not labeled element 
 * @param tagName the tested tag name
 */
export function isFormLabelableElement(tagName: string): boolean {
	switch (tagName) {
		case 'button':
		case 'input':
		case 'meter':
		case 'output':
		case 'progress':
		case 'select':
		case 'textarea':
			return true;
		default:
			break;
	}
	if (isValidCustomElementName(tagName)) {
		return isFormAssociatedCustomElementByTag(tagName);
	}
	return false;
}
