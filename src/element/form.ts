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
			return true;
		default: return false;
	}
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
		default: return false;
	}
}

/**
 * Resettable elements
 * @param tagName 
 */
export function isResettableElement(tagName: string): boolean {
	switch (tagName) {
		case 'input':
		case 'output':
		case 'select':
		case 'textarea':
			return true;
		default: return false;
	}
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
 * Labelable Elements
 * Some elements, not all of them form-associated, are categorized as labelable elements.
 * These are elements that can be associated with a label element.
 * 
 * this function ignore the 'type' attribute of 'input' tage as '<input type="hidden" />' is consdered as not labled element 
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
		default: return false;
	}
}
