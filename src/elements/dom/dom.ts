
/**
 * a normal attribute with its source value without any binding.
 */
export class Attribute<N, V> {
	constructor(public name: N, public value: V) { }
}

/**
 * an attribute with its source value for binding
 */
export class LiveAttribute<E> extends Attribute<string, string> {
	nameNode: E;
	valueNode: E;
}

/**
 * a normal text
 */
export class TextContent extends Attribute<'textContent', string> {
	static propName = 'textContent' as 'textContent';
	constructor(text: string) {
		super(TextContent.propName, text);
	}
}

/**
 * a text that its content is binding to variable from the component model.
 */
export class LiveTextContent<E> extends LiveAttribute<E>  {
	constructor(text: string) {
		super(TextContent.propName, text);
	}
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
		parseTextChild<E>(text).forEach(text => this.children.push(text));
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
	attributes: Attribute<string, string | number | boolean | object>[];

	/**
	 * hold the attrs/inputs name marked as one way binding
	 */
	inputs: LiveAttribute<E>[];

	/**
	 * hold the name of events that should be connected to a listener
	 */
	outputs: LiveAttribute<E>[];

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
			this.attributes.push(new Attribute(attrName, value ?? true));
		} else {
			this.attributes = [new Attribute(attrName, value ?? true)];
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
			this.outputs.push(new LiveAttribute<E>(eventName, handlerSource));
		} else {
			this.outputs = [new LiveAttribute<E>(eventName, handlerSource)];
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
		valueSource = parseStringTemplate(valueSource);
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

export type DOMChild<E> = DOMElementNode<E> | DOMDirectiveNode<E> | CommentNode | TextContent | LiveTextContent<E>;

export type DOMNode<E> = DOMFragmentNode<E> | DOMElementNode<E> | DOMDirectiveNode<E> | CommentNode | TextContent | LiveTextContent<E>;

export type DOMRenderNode<T, E> = (model: T) => DOMNode<E>;

export function parseTextChild<E>(text: string): Array<TextContent | LiveTextContent<E>> {
	// split from end with '}}', then search for the first '{{'
	let all: (TextContent | LiveTextContent<E>)[] = [];
	let temp = text;
	let last = temp.lastIndexOf('}}');
	let first: number;
	while (last > -1) {
		first = text.lastIndexOf('{{', last);
		if (first > -1) {
			let lastPart = temp.substring(last + 2);
			if (lastPart) {
				all.push(new TextContent(lastPart));
			}
			let liveText = new LiveTextContent<E>(temp.substring(first + 2, last));
			all.push(liveText);
			temp = temp.substring(0, first);
			last = temp.lastIndexOf('}}');
		} else {
			break;
		}
	}
	if (temp) {
		all.push(new TextContent(temp));
	}
	return all.reverse();
}

export function parseStringTemplate(text: string): string {
	const node = parseTextChild(text);
	const map = node.map(str => (str instanceof TextContent ? str.value : '${' + str.valueNode + '}')).join('');
	return '`' + map + '`';
}
