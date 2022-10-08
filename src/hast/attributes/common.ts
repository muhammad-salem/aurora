export const EmptyElements = Object.freeze(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr']);
export function isEmptyElement(tagName: string) {
	return EmptyElements.includes(tagName);
}

export const VoidElements = EmptyElements;
export const isVoidElement = isEmptyElement;


/**
 * see https://html.spec.whatwg.org/multipage/custom-elements.html#valid-custom-element-name
 * see https://github.com/mathiasbynens/mothereff.in/blob/master/custom-element-name/vendor/is-potential-custom-element-name.js
 * @param tagName
 */
export const CustomElementRegex = /^[a-z](?:[\-\.0-9_a-z\xB7\xC0-\xD6\xD8-\xF6\xF8-\u037D\u037F-\u1FFF\u200C\u200D\u203F\u2040\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD]|[\uD800-\uDB7F][\uDC00-\uDFFF])*-(?:[\-\.0-9_a-z\xB7\xC0-\xD6\xD8-\xF6\xF8-\u037D\u037F-\u1FFF\u200C\u200D\u203F\u2040\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD]|[\uD800-\uDB7F][\uDC00-\uDFFF])*$/;

export function isValidCustomElementName(tagName: string): boolean {
	return CustomElementRegex.test(tagName);
}

