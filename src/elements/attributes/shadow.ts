import { isValidCustomElementName } from './tags.js';

export const ShadowElements = [
	'article',
	'aside',
	'blockquote',
	'body',
	'div',
	'footer',
	'h1',
	'h2',
	'h3',
	'h4',
	'h5',
	'h6',
	'header',
	'main',
	'nav',
	'p',
	'section',
	'span',
];

/**
 * Note that you can't attach a shadow root to every type of element.
 * 
 * There are some that can't have a shadow DOM for security reasons (for example <a>), and more besides.
 * 
 * The following is a list of elements you can attach a shadow root to:
 * Any autonomous custom element with a valid name,
 * and [
 * article, aside, blockquote, body, div,footer,
 * h1, h2, h3, h4, h5, h6,
 * header, main, nav, p, section, span
 * ]
 * 
 * @see https://developer.mozilla.org/en-US/docs/Web/API/Element/attachShadow#elements_you_can_attach_a_shadow_to
 * @param tagName 
 * @returns 
 */
export function canAttachShadow(tagName: string) {
	if (isValidCustomElementName(tagName)) {
		return true;
	}
	return ShadowElements.includes(tagName);
}


