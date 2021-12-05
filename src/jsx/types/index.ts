
import { DomChild, DomElementNode, DomFragmentNode, DomNode, DomStructuralDirectiveNode } from '@ibyar/elements';

declare namespace Factory {
	type Key = string | number;

	/**
	 * @internal You shouldn't need to use this type since you never see these attributes
	 * inside your component or have to validate them.
	 */
	interface Attributes {
		// key?: Key | null | undefined;
	}

	interface ClassAttributes<T> extends Attributes {

	}

	interface JsxComponent<T> {
		props?: {
			[P in keyof T]?: T[P] | null | undefined;
		};
	}
}

interface AdditionalClassAttributes {
	[key: string]: string | number | null | undefined;
}


// type Attributes = { [key: string]: string | number | undefined };

type PartialAttributes<T> = Partial<T> & AdditionalClassAttributes;

declare global {
	namespace JSX {
		interface Element extends DomFragmentNode, DomElementNode, DomStructuralDirectiveNode { }
		interface ElementClass { }
		interface ElementAttributesProperty<T> extends Factory.JsxComponent<T> {

		}
		interface ElementChildrenAttribute { children: DomNode[] | undefined; }

		interface IntrinsicAttributes {
			is?: string;
		}
		interface IntrinsicClassAttributes<T> {
			[key: string]: string | number | null | undefined;
		}

		interface IntrinsicElements {
			// HTML
			a: PartialAttributes<HTMLAnchorElement>;
			abbr: PartialAttributes<HTMLElement>;
			address: PartialAttributes<HTMLElement>;
			area: PartialAttributes<HTMLAreaElement>;
			article: PartialAttributes<HTMLElement>;
			aside: PartialAttributes<HTMLElement>;
			audio: PartialAttributes<HTMLAudioElement>;
			b: PartialAttributes<HTMLElement>;
			base: PartialAttributes<HTMLBaseElement>;
			bdi: PartialAttributes<HTMLElement>;
			bdo: PartialAttributes<HTMLElement>;
			big: PartialAttributes<HTMLElement>;
			blockquote: PartialAttributes<HTMLElement>;
			body: PartialAttributes<HTMLBodyElement>;
			br: PartialAttributes<HTMLBRElement>;
			button: PartialAttributes<HTMLButtonElement>;
			canvas: PartialAttributes<HTMLCanvasElement>;
			caption: PartialAttributes<HTMLElement>;
			cite: PartialAttributes<HTMLElement>;
			code: PartialAttributes<HTMLElement>;
			col: PartialAttributes<HTMLTableColElement>;
			colgroup: PartialAttributes<HTMLTableColElement>;
			data: PartialAttributes<HTMLDataElement>;
			datalist: PartialAttributes<HTMLDataListElement>;
			dd: PartialAttributes<HTMLElement>;
			del: PartialAttributes<HTMLElement>;
			details: PartialAttributes<HTMLElement>;
			dfn: PartialAttributes<HTMLElement>;
			dialog: PartialAttributes<HTMLElement>;
			div: PartialAttributes<HTMLDivElement>;
			dl: PartialAttributes<HTMLDListElement>;
			dt: PartialAttributes<HTMLElement>;
			em: PartialAttributes<HTMLElement>;
			embed: PartialAttributes<HTMLEmbedElement>;
			fieldset: PartialAttributes<HTMLFieldSetElement>;
			figcaption: PartialAttributes<HTMLElement>;
			figure: PartialAttributes<HTMLElement>;
			footer: PartialAttributes<HTMLElement>;
			form: PartialAttributes<HTMLFormElement>;
			h1: PartialAttributes<HTMLHeadingElement>;
			h2: PartialAttributes<HTMLHeadingElement>;
			h3: PartialAttributes<HTMLHeadingElement>;
			h4: PartialAttributes<HTMLHeadingElement>;
			h5: PartialAttributes<HTMLHeadingElement>;
			h6: PartialAttributes<HTMLHeadingElement>;
			head: PartialAttributes<HTMLHeadElement>;
			header: PartialAttributes<HTMLElement>;
			hgroup: PartialAttributes<HTMLElement>;
			hr: PartialAttributes<HTMLHRElement>;
			html: PartialAttributes<HTMLHtmlElement>;
			i: PartialAttributes<HTMLElement>;
			iframe: PartialAttributes<HTMLIFrameElement>;
			img: PartialAttributes<HTMLImageElement>;
			input: PartialAttributes<HTMLInputElement>;
			ins: PartialAttributes<HTMLModElement>;
			kbd: PartialAttributes<HTMLElement>;
			keygen: PartialAttributes<HTMLElement>;
			label: PartialAttributes<HTMLLabelElement>;
			legend: PartialAttributes<HTMLLegendElement>;
			li: PartialAttributes<HTMLLIElement>;
			link: PartialAttributes<HTMLLinkElement>;
			main: PartialAttributes<HTMLElement>;
			map: PartialAttributes<HTMLMapElement>;
			mark: PartialAttributes<HTMLElement>;
			menu: PartialAttributes<HTMLElement>;
			menuitem: PartialAttributes<HTMLElement>;
			meta: PartialAttributes<HTMLMetaElement>;
			meter: PartialAttributes<HTMLElement>;
			nav: PartialAttributes<HTMLElement>;
			noindex: PartialAttributes<HTMLElement>;
			noscript: PartialAttributes<HTMLElement>;
			object: PartialAttributes<HTMLObjectElement>;
			ol: PartialAttributes<HTMLOListElement>;
			optgroup: PartialAttributes<HTMLOptGroupElement>;
			option: PartialAttributes<HTMLOptionElement>;
			output: PartialAttributes<HTMLElement>;
			p: PartialAttributes<HTMLParagraphElement>;
			param: PartialAttributes<HTMLParamElement>;
			picture: PartialAttributes<HTMLElement>;
			pre: PartialAttributes<HTMLPreElement>;
			progress: PartialAttributes<HTMLProgressElement>;
			q: PartialAttributes<HTMLQuoteElement>;
			rp: PartialAttributes<HTMLElement>;
			rt: PartialAttributes<HTMLElement>;
			ruby: PartialAttributes<HTMLElement>;
			s: PartialAttributes<HTMLElement>;
			samp: PartialAttributes<HTMLElement>;
			slot: PartialAttributes<HTMLSlotElement>;
			script: PartialAttributes<HTMLScriptElement>;
			section: PartialAttributes<HTMLElement>;
			select: PartialAttributes<HTMLSelectElement>;
			small: PartialAttributes<HTMLElement>;
			source: PartialAttributes<HTMLSourceElement>;
			span: PartialAttributes<HTMLSpanElement>;
			strong: PartialAttributes<HTMLElement>;
			style: PartialAttributes<HTMLStyleElement>;
			sub: PartialAttributes<HTMLElement>;
			summary: PartialAttributes<HTMLElement>;
			sup: PartialAttributes<HTMLElement>;
			table: PartialAttributes<HTMLTableElement>;
			template: PartialAttributes<HTMLTemplateElement>;
			tbody: PartialAttributes<HTMLTableSectionElement>;
			td: PartialAttributes<HTMLTableCellElement>;
			textarea: PartialAttributes<HTMLTextAreaElement>;
			tfoot: PartialAttributes<HTMLTableSectionElement>;
			th: PartialAttributes<HTMLTableCellElement>;
			thead: PartialAttributes<HTMLTableSectionElement>;
			time: PartialAttributes<HTMLElement>;
			title: PartialAttributes<HTMLTitleElement>;
			tr: PartialAttributes<HTMLTableRowElement>;
			track: PartialAttributes<HTMLTrackElement>;
			u: PartialAttributes<HTMLElement>;
			ul: PartialAttributes<HTMLUListElement>;
			'var': PartialAttributes<HTMLElement>;
			video: PartialAttributes<HTMLVideoElement>;
			wbr: PartialAttributes<HTMLElement>;
			webview: PartialAttributes<HTMLElement>;

			// SVG
			svg: PartialAttributes<SVGSVGElement>;

			animate: PartialAttributes<SVGAnimateElement>;
			animateMotion: PartialAttributes<SVGElement>;
			animateTransform: PartialAttributes<SVGAnimateTransformElement>;
			circle: PartialAttributes<SVGCircleElement>;
			clipPath: PartialAttributes<SVGClipPathElement>;
			defs: PartialAttributes<SVGDefsElement>;
			desc: PartialAttributes<SVGDescElement>;
			ellipse: PartialAttributes<SVGEllipseElement>;
			feBlend: PartialAttributes<SVGFEBlendElement>;
			feColorMatrix: PartialAttributes<SVGFEColorMatrixElement>;
			feComponentTransfer: PartialAttributes<SVGFEComponentTransferElement>;
			feComposite: PartialAttributes<SVGFECompositeElement>;
			feConvolveMatrix: PartialAttributes<SVGFEConvolveMatrixElement>;
			feDiffuseLighting: PartialAttributes<SVGFEDiffuseLightingElement>;
			feDisplacementMap: PartialAttributes<SVGFEDisplacementMapElement>;
			feDistantLight: PartialAttributes<SVGFEDistantLightElement>;
			feDropShadow: PartialAttributes<SVGFEDropShadowElement>;
			feFlood: PartialAttributes<SVGFEFloodElement>;
			feFuncA: PartialAttributes<SVGFEFuncAElement>;
			feFuncB: PartialAttributes<SVGFEFuncBElement>;
			feFuncG: PartialAttributes<SVGFEFuncGElement>;
			feFuncR: PartialAttributes<SVGFEFuncRElement>;
			feGaussianBlur: PartialAttributes<SVGFEGaussianBlurElement>;
			feImage: PartialAttributes<SVGFEImageElement>;
			feMerge: PartialAttributes<SVGFEMergeElement>;
			feMergeNode: PartialAttributes<SVGFEMergeNodeElement>;
			feMorphology: PartialAttributes<SVGFEMorphologyElement>;
			feOffset: PartialAttributes<SVGFEOffsetElement>;
			fePointLight: PartialAttributes<SVGFEPointLightElement>;
			feSpecularLighting: PartialAttributes<SVGFESpecularLightingElement>;
			feSpotLight: PartialAttributes<SVGFESpotLightElement>;
			feTile: PartialAttributes<SVGFETileElement>;
			feTurbulence: PartialAttributes<SVGFETurbulenceElement>;
			filter: PartialAttributes<SVGFilterElement>;
			foreignObject: PartialAttributes<SVGForeignObjectElement>;
			g: PartialAttributes<SVGGElement>;
			image: PartialAttributes<SVGImageElement>;
			line: PartialAttributes<SVGLineElement>;
			linearGradient: PartialAttributes<SVGLinearGradientElement>;
			marker: PartialAttributes<SVGMarkerElement>;
			mask: PartialAttributes<SVGMaskElement>;
			metadata: PartialAttributes<SVGMetadataElement>;
			mpath: PartialAttributes<SVGElement>;
			path: PartialAttributes<SVGPathElement>;
			pattern: PartialAttributes<SVGPatternElement>;
			polygon: PartialAttributes<SVGPolygonElement>;
			polyline: PartialAttributes<SVGPolylineElement>;
			radialGradient: PartialAttributes<SVGRadialGradientElement>;
			rect: PartialAttributes<SVGRectElement>;
			stop: PartialAttributes<SVGStopElement>;
			switch: PartialAttributes<SVGSwitchElement>;
			symbol: PartialAttributes<SVGSymbolElement>;
			text: PartialAttributes<SVGTextElement>;
			textPath: PartialAttributes<SVGTextPathElement>;
			tspan: PartialAttributes<SVGTSpanElement>;
			use: PartialAttributes<SVGUseElement>;
			view: PartialAttributes<SVGViewElement>;
		}
	}
}
