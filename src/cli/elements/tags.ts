
type SelectorType = { selector?: string, type: string };

/**
 * see https://html.spec.whatwg.org/multipage/indices.html#element-interfaces
 */
export const SelectorTypes: SelectorType[] = [
	{ selector: undefined, type: 'HTMLElement' },
	{ selector: 'a', type: 'HTMLAnchorElement' },
	{ selector: 'abbr', type: 'HTMLElement' },
	{ selector: 'address', type: 'HTMLElement' },
	{ selector: 'area', type: 'HTMLAreaElement' },
	{ selector: 'article', type: 'HTMLElement' },
	{ selector: 'aside', type: 'HTMLElement' },
	{ selector: 'audio', type: 'HTMLAudioElement' },
	{ selector: 'b', type: 'HTMLElement' },
	{ selector: 'base', type: 'HTMLBaseElement' },
	{ selector: 'bdi', type: 'HTMLElement' },
	{ selector: 'bdo', type: 'HTMLElement' },
	{ selector: 'blockquote', type: 'HTMLQuoteElement' },
	{ selector: 'body', type: 'HTMLBodyElement' },
	{ selector: 'br', type: 'HTMLBRElement' },
	{ selector: 'button', type: 'HTMLButtonElement' },
	{ selector: 'canvas', type: 'HTMLCanvasElement' },
	{ selector: 'caption', type: 'HTMLTableCaptionElement' },
	{ selector: 'cite', type: 'HTMLElement' },
	{ selector: 'code', type: 'HTMLElement' },
	{ selector: 'col', type: 'HTMLTableColElement' },
	{ selector: 'colgroup', type: 'HTMLTableColElement' },
	{ selector: 'data', type: 'HTMLDataElement' },
	{ selector: 'datalist', type: 'HTMLDataListElement' },
	{ selector: 'dd', type: 'HTMLElement' },
	{ selector: 'del', type: 'HTMLModElement' },
	{ selector: 'details', type: 'HTMLDetailsElement' },
	{ selector: 'dfn', type: 'HTMLElement' },
	// { name: 'dialog', classRef: window.HTMLDialogElement || 'HTMLElement' },
	{ selector: 'div', type: 'HTMLDivElement' },
	{ selector: 'dl', type: 'HTMLDListElement' },
	{ selector: 'dt', type: 'HTMLElement' },
	{ selector: 'em', type: 'HTMLElement' },
	{ selector: 'embed', type: 'HTMLEmbedElement' },
	{ selector: 'fieldset', type: 'HTMLFieldSetElement' },
	{ selector: 'figcaption', type: 'HTMLElement' },
	{ selector: 'figure', type: 'HTMLElement' },
	{ selector: 'footer', type: 'HTMLElement' },
	{ selector: 'form', type: 'HTMLFormElement' },
	{ selector: 'h1', type: 'HTMLHeadingElement' },
	{ selector: 'h2', type: 'HTMLHeadingElement' },
	{ selector: 'h3', type: 'HTMLHeadingElement' },
	{ selector: 'h4', type: 'HTMLHeadingElement' },
	{ selector: 'h5', type: 'HTMLHeadingElement' },
	{ selector: 'h6', type: 'HTMLHeadingElement' },
	{ selector: 'head', type: 'HTMLHeadElement' },
	{ selector: 'header', type: 'HTMLElement' },
	{ selector: 'hgroup', type: 'HTMLElement' },
	{ selector: 'hr', type: 'HTMLHRElement' },
	{ selector: 'html', type: 'HTMLHtmlElement' },
	{ selector: 'i', type: 'HTMLElement' },
	{ selector: 'iframe', type: 'HTMLIFrameElement' },
	{ selector: 'img', type: 'HTMLImageElement' },
	{ selector: 'input', type: 'HTMLInputElement' },
	{ selector: 'ins', type: 'HTMLModElement' },
	{ selector: 'kbd', type: 'HTMLElement' },
	{ selector: 'label', type: 'HTMLLabelElement' },
	{ selector: 'legend', type: 'HTMLLegendElement' },
	{ selector: 'li', type: 'HTMLLIElement' },
	{ selector: 'link', type: 'HTMLLinkElement' },
	{ selector: 'main', type: 'HTMLElement' },
	{ selector: 'map', type: 'HTMLMapElement' },
	{ selector: 'mark', type: 'HTMLElement' },
	{ selector: 'menu', type: 'HTMLMenuElement' },
	{ selector: 'meta', type: 'HTMLMetaElement' },
	{ selector: 'meter', type: 'HTMLMeterElement' },
	{ selector: 'nav', type: 'HTMLElement' },
	{ selector: 'noscript', type: 'HTMLElement' },
	{ selector: 'object', type: 'HTMLObjectElement' },
	{ selector: 'ol', type: 'HTMLOListElement' },
	{ selector: 'optgroup', type: 'HTMLOptGroupElement' },
	{ selector: 'option', type: 'HTMLOptionElement' },
	{ selector: 'output', type: 'HTMLOutputElement' },
	{ selector: 'p', type: 'HTMLParagraphElement' },
	{ selector: 'param', type: 'HTMLParamElement' },
	{ selector: 'picture', type: 'HTMLPictureElement' },
	{ selector: 'pre', type: 'HTMLPreElement' },
	{ selector: 'progress', type: 'HTMLProgressElement' },
	{ selector: 'q', type: 'HTMLQuoteElement' },
	{ selector: 'rp', type: 'HTMLElement' },
	{ selector: 'rt', type: 'HTMLElement' },
	{ selector: 'ruby', type: 'HTMLElement' },
	{ selector: 's', type: 'HTMLElement' },
	{ selector: 'samp', type: 'HTMLElement' },
	{ selector: 'script', type: 'HTMLScriptElement' },
	{ selector: 'section', type: 'HTMLElement' },
	{ selector: 'select', type: 'HTMLSelectElement' },
	{ selector: 'slot', type: 'HTMLSlotElement' },
	{ selector: 'small', type: 'HTMLElement' },
	{ selector: 'source', type: 'HTMLSourceElement' },
	{ selector: 'span', type: 'HTMLSpanElement' },
	{ selector: 'strong', type: 'HTMLElement' },
	{ selector: 'style', type: 'HTMLStyleElement' },
	{ selector: 'sub', type: 'HTMLElement' },
	{ selector: 'summary', type: 'HTMLElement' },
	{ selector: 'sup', type: 'HTMLElement' },
	{ selector: 'table', type: 'HTMLTableElement' },
	{ selector: 'tbody', type: 'HTMLTableSectionElement' },
	{ selector: 'td', type: 'HTMLTableCellElement' },
	{ selector: 'template', type: 'HTMLTemplateElement' },
	{ selector: 'textarea', type: 'HTMLTextAreaElement' },
	{ selector: 'tfoot', type: 'HTMLTableSectionElement' },
	{ selector: 'th', type: 'HTMLTableCellElement' },
	{ selector: 'thead', type: 'HTMLTableSectionElement' },
	{ selector: 'time', type: 'HTMLTimeElement' },
	{ selector: 'title', type: 'HTMLTitleElement' },
	{ selector: 'tr', type: 'HTMLTableRowElement' },
	{ selector: 'track', type: 'HTMLTrackElement' },
	{ selector: 'u', type: 'HTMLElement' },
	{ selector: 'ul', type: 'HTMLUListElement' },
	{ selector: 'var', type: 'HTMLElement' },
	{ selector: 'video', type: 'HTMLVideoElement' },
	{ selector: 'wbr', type: 'HTMLElement' },
];


export function getExtendsTypeBySelector(selector?: string) {
	return SelectorTypes.find(typeRef => typeRef.selector === selector)?.type ?? 'HTMLElement';
}