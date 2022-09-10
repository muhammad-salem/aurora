
export type TagClassRef = typeof HTMLElement;

export interface Tag {
	readonly name?: string;
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

export const DefaultTag: Tag = Object.freeze({ classRef: HTMLElement });

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
	// { name: 'dialog', classRef: window.HTMLDialogElement || HTMLElement },
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
];

const HTMLElementTagNameMap = {
	a: HTMLAnchorElement,
	abbr: HTMLElement,
	address: HTMLElement,
	area: HTMLAreaElement,
	article: HTMLElement,
	aside: HTMLElement,
	audio: HTMLAudioElement,
	b: HTMLElement,
	base: HTMLBaseElement,
	bdi: HTMLElement,
	bdo: HTMLElement,
	blockquote: HTMLQuoteElement,
	body: HTMLBodyElement,
	br: HTMLBRElement,
	button: HTMLButtonElement,
	canvas: HTMLCanvasElement,
	caption: HTMLTableCaptionElement,
	cite: HTMLElement,
	code: HTMLElement,
	col: HTMLTableColElement,
	colgroup: HTMLTableColElement,
	data: HTMLDataElement,
	datalist: HTMLDataListElement,
	dd: HTMLElement,
	del: HTMLModElement,
	details: HTMLDetailsElement,
	dfn: HTMLElement,
	div: HTMLDivElement,
	dl: HTMLDListElement,
	dt: HTMLElement,
	em: HTMLElement,
	embed: HTMLEmbedElement,
	fieldset: HTMLFieldSetElement,
	figcaption: HTMLElement,
	figure: HTMLElement,
	footer: HTMLElement,
	form: HTMLFormElement,
	h1: HTMLHeadingElement,
	h2: HTMLHeadingElement,
	h3: HTMLHeadingElement,
	h4: HTMLHeadingElement,
	h5: HTMLHeadingElement,
	h6: HTMLHeadingElement,
	head: HTMLHeadElement,
	header: HTMLElement,
	hgroup: HTMLElement,
	hr: HTMLHRElement,
	html: HTMLHtmlElement,
	i: HTMLElement,
	iframe: HTMLIFrameElement,
	img: HTMLImageElement,
	input: HTMLInputElement,
	ins: HTMLModElement,
	kbd: HTMLElement,
	label: HTMLLabelElement,
	legend: HTMLLegendElement,
	li: HTMLLIElement,
	link: HTMLLinkElement,
	main: HTMLElement,
	map: HTMLMapElement,
	mark: HTMLElement,
	menu: HTMLMenuElement,
	meta: HTMLMetaElement,
	meter: HTMLMeterElement,
	nav: HTMLElement,
	noscript: HTMLElement,
	object: HTMLObjectElement,
	ol: HTMLOListElement,
	optgroup: HTMLOptGroupElement,
	option: HTMLOptionElement,
	output: HTMLOutputElement,
	p: HTMLParagraphElement,
	param: HTMLParamElement,
	picture: HTMLPictureElement,
	pre: HTMLPreElement,
	progress: HTMLProgressElement,
	q: HTMLQuoteElement,
	rp: HTMLElement,
	rt: HTMLElement,
	ruby: HTMLElement,
	s: HTMLElement,
	samp: HTMLElement,
	script: HTMLScriptElement,
	section: HTMLElement,
	select: HTMLSelectElement,
	slot: HTMLSlotElement,
	small: HTMLElement,
	source: HTMLSourceElement,
	span: HTMLSpanElement,
	strong: HTMLElement,
	style: HTMLStyleElement,
	sub: HTMLElement,
	summary: HTMLElement,
	sup: HTMLElement,
	table: HTMLTableElement,
	tbody: HTMLTableSectionElement,
	td: HTMLTableCellElement,
	template: HTMLTemplateElement,
	textarea: HTMLTextAreaElement,
	tfoot: HTMLTableSectionElement,
	th: HTMLTableCellElement,
	thead: HTMLTableSectionElement,
	time: HTMLTimeElement,
	title: HTMLTitleElement,
	tr: HTMLTableRowElement,
	track: HTMLTrackElement,
	u: HTMLElement,
	ul: HTMLUListElement,
	var: HTMLElement,
	video: HTMLVideoElement,
	wbr: HTMLElement,
}

const SVGElementTagNameMap = {
	a: SVGAElement,
	animate: SVGAnimateElement,
	animateMotion: SVGAnimateMotionElement,
	animateTransform: SVGAnimateTransformElement,
	circle: SVGCircleElement,
	clipPath: SVGClipPathElement,
	defs: SVGDefsElement,
	desc: SVGDescElement,
	ellipse: SVGEllipseElement,
	feBlend: SVGFEBlendElement,
	feColorMatrix: SVGFEColorMatrixElement,
	feComponentTransfer: SVGFEComponentTransferElement,
	feComposite: SVGFECompositeElement,
	feConvolveMatrix: SVGFEConvolveMatrixElement,
	feDiffuseLighting: SVGFEDiffuseLightingElement,
	feDisplacementMap: SVGFEDisplacementMapElement,
	feDistantLight: SVGFEDistantLightElement,
	feDropShadow: SVGFEDropShadowElement,
	feFlood: SVGFEFloodElement,
	feFuncA: SVGFEFuncAElement,
	feFuncB: SVGFEFuncBElement,
	feFuncG: SVGFEFuncGElement,
	feFuncR: SVGFEFuncRElement,
	feGaussianBlur: SVGFEGaussianBlurElement,
	feImage: SVGFEImageElement,
	feMerge: SVGFEMergeElement,
	feMergeNode: SVGFEMergeNodeElement,
	feMorphology: SVGFEMorphologyElement,
	feOffset: SVGFEOffsetElement,
	fePointLight: SVGFEPointLightElement,
	feSpecularLighting: SVGFESpecularLightingElement,
	feSpotLight: SVGFESpotLightElement,
	feTile: SVGFETileElement,
	feTurbulence: SVGFETurbulenceElement,
	filter: SVGFilterElement,
	foreignObject: SVGForeignObjectElement,
	g: SVGGElement,
	image: SVGImageElement,
	line: SVGLineElement,
	linearGradient: SVGLinearGradientElement,
	marker: SVGMarkerElement,
	mask: SVGMaskElement,
	metadata: SVGMetadataElement,
	mpath: SVGMPathElement,
	path: SVGPathElement,
	pattern: SVGPatternElement,
	polygon: SVGPolygonElement,
	polyline: SVGPolylineElement,
	radialGradient: SVGRadialGradientElement,
	rect: SVGRectElement,
	script: SVGScriptElement,
	set: SVGSetElement,
	stop: SVGStopElement,
	style: SVGStyleElement,
	svg: SVGSVGElement,
	switch: SVGSwitchElement,
	symbol: SVGSymbolElement,
	text: SVGTextElement,
	textPath: SVGTextPathElement,
	title: SVGTitleElement,
	tspan: SVGTSpanElement,
	use: SVGUseElement,
	view: SVGViewElement,
}

export function findByTagName(tagName: string | undefined): Tag {
	if (!tagName || tagName === '' || tagName === 'none' || tagName === 'child') {
		return DefaultTag;
	}
	if (isValidCustomElementName(tagName)) {
		const classRef = customElements.get(tagName);
		if (classRef) {
			return { classRef };
		}
		throw new Error('Custom Element is not defined yet');
	}
	for (const tag of NativeTags) {
		if (tag.name === tagName) {
			return tag;
		}
	}
	return DefaultTag;
}

export function isTagNameNative(tagName: string): boolean {
	return (tagName in HTMLElementTagNameMap) || (tagName in SVGElementTagNameMap);
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

export function getTagName(classRef: TagClassRef): string | undefined {
	for (const tag of NativeTags) {
		if (tag.classRef === classRef) {
			return tag.name;
		}
	}
	return undefined;
}

export const EmptyElements = Object.freeze(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr']);
export function isEmptyElement(tagName: string) {
	return EmptyElements.includes(tagName);
}

export const VoidElements = EmptyElements;
export const isVoidElement = isEmptyElement;
