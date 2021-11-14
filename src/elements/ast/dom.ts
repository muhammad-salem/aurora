
/**
 * a normal attribute with its source value without any binding.
 */
export class Attribute<N, V> {
	constructor(public name: N, public value: V) { }
}

export class ElementAttribute<N, V> extends Attribute<N, V> { }

/**
 * an attribute with its source value for binding
 */
export class LiveAttribute extends Attribute<string, string> { }

/**
 * a normal text
 */
export class TextContent extends Attribute<'textContent', string> {
	static propName: 'textContent' = 'textContent';
	constructor(text: string) {
		super(TextContent.propName, text);
	}
}

/**
 * a text that its content is binding to variable from the component model.
 */
export class LiveTextContent extends TextContent { }

export function isLiveTextContent(text: object): text is LiveTextContent {
	return text instanceof LiveTextContent;
}

/**
 * to comment in dom
 */
export class CommentNode {
	constructor(public comment: string) { }
}


export class BaseNode {

	/**
	 * hold static attr and event that will resolve normally from the global window.
	 */
	attributes?: ElementAttribute<string, string | number | boolean | object>[];

	/**
	 * hold the attrs/inputs name marked as one way binding
	 */
	inputs?: LiveAttribute[];

	/**
	 * hold the name of events that should be connected to a listener
	 */
	outputs?: ElementAttribute<string, string>[];

	/**
	 * hold the name of attributes marked for 2 way data binding
	 */
	twoWayBinding?: LiveAttribute[];

	/**
	 * directive attribute
	 */
	templateAttrs?: LiveAttribute[];

	addAttribute(attrName: string, value?: string | number | boolean | object) {
		if (this.attributes) {
			this.attributes.push(new ElementAttribute(attrName, value ?? true));
		} else {
			this.attributes = [new ElementAttribute(attrName, value ?? true)];
		}
	}

	addInput(attrName: string, valueSource: string) {
		if (this.inputs) {
			this.inputs.push(new LiveAttribute(attrName, valueSource));
		} else {
			this.inputs = [new LiveAttribute(attrName, valueSource)];
		}
	}

	addOutput(eventName: string, handlerSource: string) {
		if (this.outputs) {
			this.outputs.push(new LiveAttribute(eventName, handlerSource));
		} else {
			this.outputs = [new LiveAttribute(eventName, handlerSource)];
		}
	}

	addTwoWayBinding(eventName: string, handlerSource: string) {
		if (this.twoWayBinding) {
			this.twoWayBinding.push(new LiveAttribute(eventName, handlerSource));
		} else {
			this.twoWayBinding = [new LiveAttribute(eventName, handlerSource)];
		}
	}

	addTemplateAttr(attrName: string, valueSource: string) {
		valueSource = valueSource.trim();
		if (/^\{\{(.+)\}\}$/g.test(valueSource)) {
			// as one way binding
			const substring = valueSource.substring(2, valueSource.length - 2);
			if (!(/\{\{(.+)\}\}/g).test(substring)) {
				this.addInput(attrName, substring);
				return;
			}
		}
		// as string 
		valueSource = parseStringTemplate(valueSource);
		if (this.templateAttrs) {
			this.templateAttrs.push(new LiveAttribute(attrName, valueSource));
		} else {
			this.templateAttrs = [new LiveAttribute(attrName, valueSource)];
		}
	}

}

export class DOMParentNode extends BaseNode {
	/**
	 * element children list
	 */
	children?: DOMChild[];

	addChild(child: DOMChild) {
		if (this.children) {
			this.children.push(child);
		} else {
			this.children = [child];
		}
	}

	addTextChild(text: string) {
		const children = (this.children ??= []);
		parseTextChild(text).forEach(childText => children.push(childText));
	}

}

/**
 * parent for a list of elements 
 */
export class DOMFragmentNode extends DOMParentNode {
	constructor(children?: DOMChild[]) {
		super();
		if (children) {
			this.children = children;
		}
	}
}
export class DOMElementNode extends DOMParentNode {

	/**
	 * the tag name of the element 
	 */
	tagName: string;

	/**
	 * used to upgrade an element to another custom-element name
	 */
	is?: string;

	/**
	 * a given name for element
	 */
	templateRefName?: Attribute<string, string | undefined>;

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

	setTemplateRefName(name: string, value?: string) {
		this.templateRefName = new Attribute(name, value);
	}

}


/**
 * structural directive 
 */
export class DOMDirectiveNode extends BaseNode {

	/**
	 * name of the directive 
	 */
	name: string;

	/**
	 * value of the directive 
	 */
	value?: string;

	/**
	 * the value of the template node, that this directive going to host-on 
	 */
	node: DOMNode;

	constructor(name: string, node: DOMNode, value?: string) {
		super();
		this.name = name;
		this.node = node;
		this.value = value;
	}
}
export type DOMChild = DOMElementNode | DOMDirectiveNode | CommentNode | TextContent | LiveTextContent;

export type DOMNode = DOMFragmentNode | DOMElementNode | DOMDirectiveNode | CommentNode | TextContent | LiveTextContent;

export type DOMRenderNode<T> = (model: T) => DOMNode;

export function parseTextChild(text: string): Array<TextContent | LiveTextContent> {
	// split from end with '}}', then search for the first '{{'
	let all: (TextContent | LiveTextContent)[] = [];
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
			const liveText = new LiveTextContent(temp.substring(first + 2, last));
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
	const map = node.map(str => (str instanceof LiveTextContent ? '${' + str.value + '}' : str.value)).join('');
	return '`' + map + '`';
}
