
export type TagClassRef = typeof HTMLElement;

export interface Tag {
	readonly name: string | null;
	readonly classRef: TagClassRef;
}

export function getClassRef(htmlElementName: string): TagClassRef {
	if (Reflect.has(window, htmlElementName)) {
		return Reflect.get(window, htmlElementName) as TagClassRef;
	} else if (isMedia(htmlElementName)) {
		return getClassRef('HTMLMediaElement');
	} else {
		return HTMLElement;
	}
}

function isMedia(name: string) {
	name = name.toLowerCase();
	return name.includes('video') || name.includes('audio');
}

export const DefaultTag: Tag = { name: null, classRef: HTMLElement };

/**
 * see https://html.spec.whatwg.org/multipage/indices.html#element-interfaces
 */
export const NativeTags: Tag[] = [
	{ name: 'a', classRef: HTMLAnchorElement },
	{ name: 'abbr', classRef: HTMLElement },
	{ name: 'address', classRef: HTMLElement },
	{ name: 'area', classRef: HTMLAreaElement },
	{ name: 'article', classRef: HTMLElement },
	{ name: 'aside', classRef: HTMLElement },
	{ name: 'audio', classRef: HTMLAudioElement },
	{ name: 'b', classRef: HTMLElement },
	{ name: 'base', classRef: HTMLBaseElement },
	{ name: 'bdi', classRef: HTMLElement },
	{ name: 'bdo', classRef: HTMLElement },
	{ name: 'blockquote', classRef: HTMLQuoteElement },
	{ name: 'body', classRef: HTMLBodyElement },
	{ name: 'br', classRef: HTMLBRElement },
	{ name: 'button', classRef: HTMLButtonElement },
	{ name: 'canvas', classRef: HTMLCanvasElement },
	{ name: 'caption', classRef: HTMLTableCaptionElement },
	{ name: 'cite', classRef: HTMLElement },
	{ name: 'code', classRef: HTMLElement },
	{ name: 'col', classRef: HTMLTableColElement },
	{ name: 'colgroup', classRef: HTMLTableColElement },
	{ name: 'data', classRef: HTMLDataElement },
	{ name: 'datalist', classRef: HTMLDataListElement },
	{ name: 'dd', classRef: HTMLElement },
	{ name: 'del', classRef: HTMLModElement },
	{ name: 'details', classRef: HTMLDetailsElement },
	{ name: 'dfn', classRef: HTMLElement },
	{ name: 'dialog', classRef: window.HTMLDialogElement || HTMLElement },
	{ name: 'div', classRef: HTMLDivElement },
	{ name: 'dl', classRef: HTMLDListElement },
	{ name: 'dt', classRef: HTMLElement },
	{ name: 'em', classRef: HTMLElement },
	{ name: 'embed', classRef: HTMLEmbedElement },
	{ name: 'fieldset', classRef: HTMLFieldSetElement },
	{ name: 'figcaption', classRef: HTMLElement },
	{ name: 'figure', classRef: HTMLElement },
	{ name: 'footer', classRef: HTMLElement },
	{ name: 'form', classRef: HTMLFormElement },
	{ name: 'h1', classRef: HTMLHeadingElement },
	{ name: 'h2', classRef: HTMLHeadingElement },
	{ name: 'h3', classRef: HTMLHeadingElement },
	{ name: 'h4', classRef: HTMLHeadingElement },
	{ name: 'h5', classRef: HTMLHeadingElement },
	{ name: 'h6', classRef: HTMLHeadingElement },
	{ name: 'head', classRef: HTMLHeadElement },
	{ name: 'header', classRef: HTMLElement },
	{ name: 'hgroup', classRef: HTMLElement },
	{ name: 'hr', classRef: HTMLHRElement },
	{ name: 'html', classRef: HTMLHtmlElement },
	{ name: 'i', classRef: HTMLElement },
	{ name: 'iframe', classRef: HTMLIFrameElement },
	{ name: 'img', classRef: HTMLImageElement },
	{ name: 'input', classRef: HTMLInputElement },
	{ name: 'ins', classRef: HTMLModElement },
	{ name: 'kbd', classRef: HTMLElement },
	{ name: 'label', classRef: HTMLLabelElement },
	{ name: 'legend', classRef: HTMLLegendElement },
	{ name: 'li', classRef: HTMLLIElement },
	{ name: 'link', classRef: HTMLLinkElement },
	{ name: 'main', classRef: HTMLElement },
	{ name: 'map', classRef: HTMLMapElement },
	{ name: 'mark', classRef: HTMLElement },
	{ name: 'menu', classRef: HTMLMenuElement },
	{ name: 'meta', classRef: HTMLMetaElement },
	{ name: 'meter', classRef: HTMLMeterElement },
	{ name: 'nav', classRef: HTMLElement },
	{ name: 'noscript', classRef: HTMLElement },
	{ name: 'object', classRef: HTMLObjectElement },
	{ name: 'ol', classRef: HTMLOListElement },
	{ name: 'optgroup', classRef: HTMLOptGroupElement },
	{ name: 'option', classRef: HTMLOptionElement },
	{ name: 'output', classRef: HTMLOutputElement },
	{ name: 'p', classRef: HTMLParagraphElement },
	{ name: 'param', classRef: HTMLParamElement },
	{ name: 'picture', classRef: HTMLPictureElement },
	{ name: 'pre', classRef: HTMLPreElement },
	{ name: 'progress', classRef: HTMLProgressElement },
	{ name: 'q', classRef: HTMLQuoteElement },
	{ name: 'rp', classRef: HTMLElement },
	{ name: 'rt', classRef: HTMLElement },
	{ name: 'ruby', classRef: HTMLElement },
	{ name: 's', classRef: HTMLElement },
	{ name: 'samp', classRef: HTMLElement },
	{ name: 'script', classRef: HTMLScriptElement },
	{ name: 'section', classRef: HTMLElement },
	{ name: 'select', classRef: HTMLSelectElement },
	{ name: 'slot', classRef: HTMLSlotElement },
	{ name: 'small', classRef: HTMLElement },
	{ name: 'source', classRef: HTMLSourceElement },
	{ name: 'span', classRef: HTMLSpanElement },
	{ name: 'strong', classRef: HTMLElement },
	{ name: 'style', classRef: HTMLStyleElement },
	{ name: 'sub', classRef: HTMLElement },
	{ name: 'summary', classRef: HTMLElement },
	{ name: 'sup', classRef: HTMLElement },
	{ name: 'table', classRef: HTMLTableElement },
	{ name: 'tbody', classRef: HTMLTableSectionElement },
	{ name: 'td', classRef: HTMLTableCellElement },
	{ name: 'template', classRef: HTMLTemplateElement },
	{ name: 'textarea', classRef: HTMLTextAreaElement },
	{ name: 'tfoot', classRef: HTMLTableSectionElement },
	{ name: 'th', classRef: HTMLTableCellElement },
	{ name: 'thead', classRef: HTMLTableSectionElement },
	{ name: 'time', classRef: HTMLTimeElement },
	{ name: 'title', classRef: HTMLTitleElement },
	{ name: 'tr', classRef: HTMLTableRowElement },
	{ name: 'track', classRef: HTMLTrackElement },
	{ name: 'u', classRef: HTMLElement },
	{ name: 'ul', classRef: HTMLUListElement },
	{ name: 'var', classRef: HTMLElement },
	{ name: 'video', classRef: HTMLVideoElement },
	{ name: 'wbr', classRef: HTMLElement },
	{ name: 'virtual-scroller', classRef: HTMLElement }
];

export function findByTagName(tagName: string | undefined): Tag {
	if (!tagName || tagName === '' || tagName === 'none' || tagName === 'child') {
		return DefaultTag;
	}
	for (const tag of NativeTags) {
		if (tag.name === tagName) {
			return tag;
		}
	}
	return DefaultTag;
}

export function isTagNameNative(tagName: string): boolean {
	for (const tag of NativeTags) {
		if (tag.name === tagName) {
			return true;
		}
	}
	return false;
}

/**
 * see https://html.spec.whatwg.org/multipage/custom-elements.html#valid-custom-element-name
 * see https://github.com/mathiasbynens/mothereff.in/blob/master/custom-element-name/vendor/is-potential-custom-element-name.js
 * @param tagName
 */
export const CustomElementRegex = /^[a-z](?:[\-\.0-9_a-z\xB7\xC0-\xD6\xD8-\xF6\xF8-\u037D\u037F-\u1FFF\u200C\u200D\u203F\u2040\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD]|[\uD800-\uDB7F][\uDC00-\uDFFF])*-(?:[\-\.0-9_a-z\xB7\xC0-\xD6\xD8-\xF6\xF8-\u037D\u037F-\u1FFF\u200C\u200D\u203F\u2040\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD]|[\uD800-\uDB7F][\uDC00-\uDFFF])*$/;

export function isValidCustomElementName(tagName: string): boolean {
	return CustomElementRegex.test(tagName);
}

export function isHTMLUnknownElementTagName(tagName: string): boolean {
	for (const tag of NativeTags) {
		if (tag.name === tagName) {
			return false;
		}
	}
	if (isValidCustomElementName(tagName)) {
		return false;
	}
	return true;
}

export function getTagName(classRef: TagClassRef): string | null {
	for (const tag of NativeTags) {
		if (tag.classRef === classRef) {
			return tag.name;
		}
	}
	return null;
}

export const EmptyElements = ['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr'];
export function isEmptyElement(tagName: string) {
	return EmptyElements.includes(tagName);
}

export const VoidElements = EmptyElements;
export const isVoidElement = isEmptyElement;
