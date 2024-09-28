
/**
 * a normal attribute with its source value without any binding.
 */
export class Attribute<N, V> {
	constructor(public name: N, public value: V) { }
	toJSON() {
		return Object.assign({}, this, { type: 'Attribute' });
	}
}

export class ElementAttribute<N, V> extends Attribute<N, V> {
	toJSON() {
		return Object.assign({}, this, { type: 'ElementAttribute' });
	}
}

/**
 * an attribute with its source value for binding
 */
export class LiveAttribute extends Attribute<string, string> {
	toJSON() {
		return Object.assign({}, this, { type: 'LiveAttribute' });
	}
}

/**
 * 
 * @param name 
 * @param value 
 * @returns LiveAttribute
 */
export function createLiveAttribute(name: string, value: string) {
	return new LiveAttribute(name, value);
}

/**
 * a normal text
 */
export class TextContent extends Attribute<'textContent', string> {
	static propName: 'textContent' = 'textContent';
	constructor(text: string) {
		super(TextContent.propName, text);
	}
	toJSON() {
		return Object.assign({}, this, { type: 'TextContent' });
	}
}

/**
 * a text that its content is binding to variable from the component model.
 */
export class LiveTextContent extends TextContent {
	toJSON() {
		return Object.assign({}, this, { type: 'LiveTextContent' });
	}
}

export function isLiveTextContent(text: object): text is LiveTextContent {
	return text instanceof LiveTextContent;
}

export function isLocalTemplateVariables(text: object): text is LocalTemplateVariables {
	return text instanceof LocalTemplateVariables;
}

/**
 * to comment in dom
 */
export class CommentNode {
	constructor(public comment: string) { }
	toJSON() {
		return Object.assign({}, this, { type: 'CommentNode' });
	}
}

export class LocalTemplateVariables {
	constructor(public declarations: string) { }

	toJSON() {
		return Object.assign({}, this, { type: 'LocalTemplateVariables' });
	}
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

	/**
	 * attributes directive
	 */
	attributeDirectives?: DomAttributeDirectiveNode[];

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

	toJSON() {
		return Object.assign({}, this, { type: 'BaseNode' });
	}

}

export class DomAttributeDirectiveNode extends BaseNode {

	/**
	 * name of the directive 
	 */
	name: string;


	/**
	 * set to `undefined` stop, loop
	 */
	declare attributeDirectives: undefined;

	constructor(name: string) {
		super();
		this.name = name;
	}

	toJSON() {
		return Object.assign({}, this, { type: 'DomAttributeDirectiveNode' });
	}
}

export class DomParentNode extends BaseNode {
	/**
	 * element children list
	 */
	children?: DomChild[];

	addChild(child: DomChild) {
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

	toJSON() {
		return Object.assign({}, this, { type: 'DomParentNode' });
	}
}

/**
 * parent for a list of elements 
 */
export class DomFragmentNode extends DomParentNode {
	constructor(children?: DomChild[]) {
		super();
		if (children) {
			this.children = children;
		}
	}
	toJSON() {
		return Object.assign({}, this, { type: 'DomFragmentNode' });
	}
}

/**
 * dom structural successor structural fragment node
 */
export class DomStructuralDirectiveSuccessorNode extends DomFragmentNode {
	declare children: [DomStructuralDirectiveNode];
	constructor(public name: string) {
		super([]);
	}
	toJSON() {
		return Object.assign({}, this, { type: 'StructuralDirectiveSuccessorNode' });
	}
}

export class DomElementNode extends DomParentNode {

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

	toJSON() {
		return Object.assign({}, this, { type: 'DomElementNode' });
	}
}

/**
 * structural directive 
 */
export class DomStructuralDirectiveNode extends BaseNode {

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
	node: DomNode;

	/**
	 * successors directives
	 */
	successors?: DomStructuralDirectiveSuccessorNode[];

	constructor(name: string, node: DomNode, value?: string) {
		super();
		this.name = name;
		this.node = node!;
		this.value = value;
	}

	toJSON() {
		return Object.assign({}, this, { type: 'DomStructuralDirectiveNode' });
	}
}

export function isDOMDirectiveNode(node: object): node is DomStructuralDirectiveNode {
	return node instanceof DomStructuralDirectiveNode;
}
export type DomChild = DomElementNode | DomStructuralDirectiveNode | LocalTemplateVariables | CommentNode | TextContent | LiveTextContent;

export type DomNode = DomFragmentNode | DomElementNode | DomStructuralDirectiveNode | LocalTemplateVariables | CommentNode | TextContent | LiveTextContent;

export type DomRenderNode<T> = (model: T) => DomNode;

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
