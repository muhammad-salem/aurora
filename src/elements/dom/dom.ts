/**
 * a normal attribute with its source value without any binding.
 */
export class TextAttribute {
	constructor(public attrName: string, public attrValue: string | number | boolean | object) { }
}

/**
 * an attribute with its source value for binding
 */
export class LiveAttribute<E> {
	constructor(public attrName: string, public sourceValue: string) { }
	sourceNode: E;
	attrNode: E;
}

/**
 * an event name and its handler function
 */
export class LiveEvent<E> {
	constructor(public eventName: string, public sourceHandler: string | Function) { }
	eventNode: E;
	sourceNode: E;
}

/**
 * a normal text
 */
export class TextNode {
	constructor(public textValue: string) { }
}

/**
 * a text that its content is binding to variable from the component model.
 */
export class LiveTextNode<E>  {
	constructor(public textValue: string) { }
	textNode: E;
}

/**
 * to comment in dom
 */
export class CommentNode {
	constructor(public comment: string) { }
}

export class DOMParentNode<E> {
	/**
	 * element children list
	 */
	children: DOMChild<E>[];

	addChild(child: DOMChild<E>) {
		if (this.children) {
			this.children.push(child);
		} else {
			this.children = [child];
		}
	}

	addTextChild(text: string) {
		if (!this.children) {
			this.children = [];
		}
		parseTextChild(text).forEach(text => this.children.push(text));
	}

}

/**
 * parent for a list of elements 
 */
export class DOMFragmentNode<E> extends DOMParentNode<E> {

	constructor(children?: DOMChild<E>[]) {
		super();
		if (children) {
			this.children = children;
		}
	}

}

export class BaseNode<E> extends DOMParentNode<E> {

	/**
	 * a given name for element
	 */
	templateRefName: LiveAttribute<E>;

	/**
	 * hold static attr and event that will resolve normally from the global window.
	 */
	attributes: TextAttribute[];

	/**
	 * hold the attrs/inputs name marked as one way binding
	 */
	inputs: LiveAttribute<E>[];

	/**
	 * hold the name of events that should be connected to a listener
	 */
	outputs: LiveEvent<E>[];

	/**
	 * hold the name of attributes marked for 2 way data binding
	 */
	twoWayBinding: LiveAttribute<E>[];

	/**
	 * directive attribute
	 */
	templateAttrs: LiveAttribute<E>[];

	setTemplateRefName(name: string, value?: string) {
		this.templateRefName = new LiveAttribute(name, value || '');
	}

	addAttribute(attrName: string, value?: string | number | boolean | object) {
		if (this.attributes) {
			this.attributes.push(new TextAttribute(attrName, value || true));
		} else {
			this.attributes = [new TextAttribute(attrName, value || true)];
		}
	}

	addInput(attrName: string, valueSource: string) {
		if (this.inputs) {
			this.inputs.push(new LiveAttribute<E>(attrName, valueSource));
		} else {
			this.inputs = [new LiveAttribute<E>(attrName, valueSource)];
		}
	}

	addOutput(eventName: string, handlerSource: string) {
		if (this.outputs) {
			this.outputs.push(new LiveEvent<E>(eventName, handlerSource));
		} else {
			this.outputs = [new LiveEvent<E>(eventName, handlerSource)];
		}
	}

	addTwoWayBinding(eventName: string, handlerSource: string) {
		if (this.twoWayBinding) {
			this.twoWayBinding.push(new LiveAttribute<E>(eventName, handlerSource));
		} else {
			this.twoWayBinding = [new LiveAttribute<E>(eventName, handlerSource)];
		}
	}

	addTemplateAttr(attrName: string, valueSource: string) {
		if (this.templateAttrs) {
			this.templateAttrs.push(new LiveAttribute<E>(attrName, valueSource));
		} else {
			this.templateAttrs = [new LiveAttribute<E>(attrName, valueSource)];
		}
	}

}

/**
 * structural directive 
 */
export class DOMDirectiveNode<E> extends BaseNode<E> {

	/**
	 * name of the directive 
	 */
	directiveName: string;

	/**
	 * value of the directive 
	 */
	directiveValue: string;

	constructor(directiveName: string, directiveValue: string) {
		super();
		this.directiveName = directiveName;
		this.directiveValue = directiveValue;
	}
}

export class DOMElementNode<E> extends BaseNode<E> {

	/**
	 * the tag name of the element 
	 */
	tagName: string;

	/**
	 * used to upgrade an element to another custom-element name
	 */
	is?: string;

	constructor(tagName: string, is?: string) {
		super();
		this.tagName = tagName;
		if (is) {
			this.is = is;
		}
	}

	setTagName(tagName: string) {
		this.tagName = tagName;
	}

}

export type DOMChild<E> = DOMElementNode<E> | DOMDirectiveNode<E> | CommentNode | TextNode | LiveTextNode<E>;

export type DOMNode<E> = DOMFragmentNode<E> | DOMElementNode<E> | DOMDirectiveNode<E> | CommentNode | TextNode | LiveTextNode<E>;

export type DOMRenderNode<T, E> = (model: T) => DOMNode<E>;

export function parseTextChild<E>(text: string) {
	// split from end with '}}', then search for the first '{{'
	let all: (TextNode | LiveTextNode<E>)[] = [];
	let temp = text;
	let last = temp.lastIndexOf('}}');
	let first: number;
	while (last > -1) {
		first = text.lastIndexOf('{{', last);
		if (first > -1) {
			let lastPart = temp.substring(last + 2);
			if (lastPart) {
				all.push(new TextNode(lastPart));
			}
			let liveText = new LiveTextNode(temp.substring(first + 2, last));
			all.push(liveText);
			temp = temp.substring(0, first);
			last = temp.lastIndexOf('}}');
		} else {
			break;
		}
	}
	if (temp) {
		all.push(new TextNode(temp));
	}
	return all.reverse();
}
