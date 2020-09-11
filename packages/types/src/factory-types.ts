declare global {
	export namespace JSX {
		interface IntrinsicElements {
			[elemName: string]: 'fragment' | 'comment' | any;
		}
	}
}

export type JsxAttributes = { [key: string]: any };

export interface JsxComponent {
	tagName: string;
	attributes?: JsxAttributes;
	children?: (string | JsxComponent)[];
}

export type JSXRender<T> = (model: T) => JsxComponent;

export interface JsxComponentWithName extends JsxComponent {
	element: HTMLElement;
}

export function isJsxComponentWithElement(componet: JsxComponent): componet is JsxComponentWithName {
	return Reflect.has(componet, 'element');
}

export function toJsxComponentWithElement(componet: JsxComponent, element: HTMLElement): void {
	(componet as JsxComponentWithName).element = element;
}

export class AttrDiscription {

	/**
	 * Template reference variables (#var)
	 */
	elementName: string;
	directive: string;
	directiveName: string;
	directiveValue: string;

	is: string;
	comment: string;

	/**
	 * two-way data binding.
	 */
	property: Map<string, string>;
	/**
	 * one-way data binding.
	 */
	expression: Map<string, string>;
	/**
	 * init attr from given object
	 */
	objects: Map<string, object>;
	/**
	 * init attr from property without binding
	 */
	lessbinding: Map<string, string>;
	/**
	 * init normal atrr, string, number, boolean, with no binding at all
	 */
	attr: Map<string, string | boolean>;
	/**
	 * handle events, 
	 */
	events: Map<string, string | Function>;

	template: Map<string, string>;

	constructor() {
		this.property = new Map<string, string>();
		this.expression = new Map<string, string>();
		this.objects = new Map<string, object>();
		this.lessbinding = new Map<string, string>();
		this.attr = new Map<string, string>();
		this.events = new Map<string, string | Function>();
		this.template = new Map<string, string>();
	}

	setAttrIs(tageName: string) {
		this.is = tageName;
	}

	setComment(comment: string) {
		this.comment = comment;
	}

	addPropertyBinding(attr: string, value: string) {
		this.property.set(attr, value);
	}

	addExpressionBinding(attr: string, value: string) {
		this.expression.set(attr, value);
	}

	addObjectRecord(attr: string, value: object) {
		this.objects.set(attr, value);
	}

	addEventRecord(attr: string, value: string | Function) {
		this.events.set(attr, value);
	}

	addLessbinding(attr: string, value: any) {
		this.lessbinding.set(attr, value);
	}

	addTemplate(attr: string, value: any) {
		this.attr.set(attr, value);
	}

	addAttr(attr: string, value: any) {
		this.attr.set(attr, value);
	}
}

export class JsxAttrComponent {
	tagName: string;
	attributes?: AttrDiscription;
	children?: (string | JsxAttrComponent)[];

	constructor(tagName: string) {
		this.tagName = tagName;
	}
}
