import { isEmptyElement } from '../attributes/tags.js';
import {
	DomElementNode, CommentNode, parseTextChild,
	TextContent, LiveTextContent, DomFragmentNode,
	DomStructuralDirectiveNode, DomNode, DomChild,
	ElementAttribute, Attribute, DomAttributeDirectiveNode, BaseNode
} from '../ast/dom.js';
import { directiveRegistry } from '../directives/register-directive.js';

type Token = (token: string) => Token;

type ChildNode = DomElementNode | CommentNode | string;

export class EscapeHTMLCharacter {
	static ESCAPE_MAP: { [key: string]: string } = {
		'&amp;': '&',
		'&lt;': '<',
		'&gt;': '>',
		'&quot;': '"',
		'&#x27;': "'",
		'&#x60;': '`'
	};
	test: RegExp;
	replace: RegExp;
	constructor() {
		const escapeRegexSource = '(?:' + Object.keys(EscapeHTMLCharacter.ESCAPE_MAP).join('|') + ')';
		this.test = new RegExp(escapeRegexSource);
		this.replace = new RegExp(escapeRegexSource, 'g');
	}

	escaper(match: string): string {
		return EscapeHTMLCharacter.ESCAPE_MAP[match];
	}

	unescape(text: string): string {
		if (!text) {
			return text;
		}
		return this.test.test(text) ? text.replace(this.replace, this.escaper) : text;
	}
}

export class NodeParser {

	private index: number;
	private stateFn: Token;

	private tagNameRegExp = /[\-\.0-9_a-z\xB7\xC0-\xD6\xD8-\xF6\xF8-\u037D\u037F-\u1FFF\u200C\u200D\u203F\u2040\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD]|[\uD800-\uDB7F][\uDC00-\uDFFF]/;

	private childStack: DomChild[];
	private stackTrace: ChildNode[];

	private get currentNode(): DomElementNode {
		return this.stackTrace[this.stackTrace.length - 1] as DomElementNode;
	}

	private commentOpenCount = 0;
	private commentCloseCount = 0;

	private tempText: string;

	private propertyName: string;
	private propertyValue: string;
	private propType: 'attr' | 'ref-name' | 'input' | 'output' | 'two-way';

	private escaper = new EscapeHTMLCharacter();

	parse(html: string)/*: DomNode*/ {
		this.reset();
		for (; this.index < html.length; this.index++) {
			this.stateFn = this.stateFn(html[this.index]);
		}
		if (this.tempText && this.stateFn === this.parseText) {
			this.stateFn('<');
		}
		if (this.stackTrace.length > 0) {
			console.error(this.stackTrace);
			throw new Error(`error parsing html, had ${this.stackTrace.length} element, with no closing tag`);
		}
		let stack = this.childStack;
		this.reset();
		return stack;
	}

	private reset() {
		this.index = 0;
		this.childStack = [];
		this.stackTrace = [];
		this.propType = 'attr';
		this.commentOpenCount = 0;
		this.commentCloseCount = 0;
		this.stateFn = this.parseText;
		this.propertyName = this.propertyValue = this.tempText = '';
	}

	private parseText(token: string) {
		if (token === '<') {
			if (this.tempText) {
				this.tempText = this.escaper.unescape(this.tempText);
				this.stackTrace.push(this.tempText);
				this.popElement();
				this.tempText = '';
			}
			return this.parseTag;
		}
		this.tempText += token;
		return this.parseText;
	}

	private parseTag(token: string) {
		if (token === '/') {
			return this.parseCloseTag;
		}
		if (token === '!') {
			this.commentOpenCount = 0;
			this.commentCloseCount = 0;
			return this.parseComment;
		}
		this.index--;
		return this.parseOpenTag;
	}

	private parseComment(token: string) {
		if (token === '-') {
			if (this.commentOpenCount < 2) {
				this.commentOpenCount++;
			} else {
				this.commentCloseCount++;
			}
			return this.parseComment;
		}
		else if (token === '>' && this.commentCloseCount === 2) {
			this.tempText = this.escaper.unescape(this.tempText);
			this.stackTrace.push(new CommentNode(this.tempText.trim()));
			this.popElement();
			this.tempText = '';
			this.commentOpenCount = 0;
			this.commentCloseCount = 0;
			return this.parseText;
		}
		if (this.commentCloseCount > 0) {
			for (let i = 0; i < this.commentCloseCount; i++) {
				this.tempText += '-';
			}
			this.commentCloseCount = 0;
		}
		this.tempText += token;
		return this.parseComment;
	}

	private parseCloseTag(token: string) {
		if (token === '>') {
			if (!isEmptyElement(this.currentNode.tagName)
				&& this.currentNode.tagName.trim().toLowerCase() !== this.tempText.trim().toLowerCase()
			) {
				throw 'Wrong closed tag at char ' + this.index;
			}
			this.popElement();
			this.tempText = '';
			return this.parseText;
		}
		this.tempText += token;
		return this.parseCloseTag;
	}

	private parseOpenTag(token: string) {
		if (token === '>') {
			this.stackTrace.push(new DomElementNode(this.tempText));
			if (isEmptyElement(this.tempText)) {
				this.popElement();
			}
			this.tempText = '';
			return this.parseText;
		}
		else if (this.tagNameRegExp.test(token)) {
			this.tempText += token;
			return this.parseOpenTag;
		}
		else if (/\s/.test(token)) {
			this.stackTrace.push(new DomElementNode(this.tempText));
			this.tempText = '';
			this.propType = 'attr';
			return this.parsePropertyName;
		}
	}

	private parsePropertyName(token: string) {
		if (token === '>') {
			if (this.tempText.trim()) {
				this.propertyName = this.tempText;
				this.currentNode.addAttribute(this.propertyName, true);
				this.propertyName, this.propertyValue = this.tempText = '';
			}
			if (isEmptyElement(this.currentNode.tagName)) {
				this.popElement();
			}
			this.tempText = '';
			return this.parseText;
		}
		else if (token === '/') {
			return this.parsePropertyName;
		}
		else if (/\[/.test(token)) {
			this.propType = 'input';
			return this.parseInputOutput;
		}
		else if (/\(|@/.test(token)) {
			this.propType = 'output';
			return this.parseInputOutput;
		}
		else if (/#/.test(token)) {
			this.propType = 'ref-name';
			return this.parseRefName;
		}
		else if (/=/.test(token)) {
			this.propertyName = this.tempText;
			this.tempText = '';
			return this.parsePropertyName;
		} else if (/"/.test(token)) {
			return this.parsePropertyValue;
		} else if (/\d/.test(token)) {
			this.tempText += token;
			return this.parsePropertyValue;
		}
		else if (/\s/.test(token)) {
			if (this.tempText.trim()) {
				this.propertyName = this.tempText;
				this.currentNode.addAttribute(this.propertyName, true);
				this.propertyName, this.propertyValue = this.tempText = '';
			}
			return this.parsePropertyName;
		}
		this.tempText += token;
		return this.parsePropertyName;
	}



	private parseRefName(token: string) {
		if (/=/.test(token)) {
			return this.parseRefName;
		}
		else if (/"/.test(token)) {
			this.propertyName = this.tempText;
			this.tempText = '';
			return this.parsePropertyValue;
		} else if (/\s/.test(token)) {
			this.currentNode.setTemplateRefName(this.tempText, '');
			this.propertyName = this.tempText = '';
			this.propType = 'attr';
			return this.parsePropertyName;
		} else if (/>/.test(token)) {
			this.currentNode.setTemplateRefName(this.tempText, '');
			this.propertyName = this.tempText = '';
			this.propType = 'attr';
			return this.parseText;
		}
		this.tempText += token;
		return this.parseRefName;
	}

	private parseInputOutput(token: string) {
		if (/\(/.test(token)) {
			this.propType = 'two-way';
			return this.parseInputOutput;
		}
		else if (/\)|\]|=/.test(token)) {
			return this.parseInputOutput;
		}
		else if (/"/.test(token)) {
			this.propertyName = this.tempText;
			this.tempText = '';
			return this.parsePropertyValue;
		}
		this.tempText += token;
		return this.parseInputOutput;
	}

	private parsePropertyValue(token: string) {
		if (/"/.test(token)) {
			this.propertyValue = this.tempText;
			switch (this.propType) {
				case 'input':
					this.currentNode.addInput(this.propertyName, this.propertyValue);
					break;
				case 'output':
					this.currentNode.addOutput(this.propertyName, this.propertyValue);
					break;
				case 'two-way':
					this.currentNode.addTwoWayBinding(this.propertyName, this.propertyValue);
					break;
				case 'ref-name':
					this.currentNode.setTemplateRefName(this.propertyName, this.propertyValue);
					break;
				case 'attr':
				default:
					if (/^([-+]?\d*\.?\d+)(?:[eE]([-+]?\d+))?$/.test(this.propertyValue.trim())) {
						this.currentNode.addAttribute(this.propertyName, +this.propertyValue.trim());
					} else if (/^(true|false)$/.test(this.propertyValue.trim().toLowerCase())) {
						if (this.propertyValue.trim().toLowerCase() === 'true') {
							this.currentNode.addAttribute(this.propertyName, true);
						} else {
							this.currentNode.addAttribute(this.propertyName, false);
						}
					}
					else {
						this.currentNode.addAttribute(this.propertyName, this.propertyValue);
					}
			}
			this.propertyName, this.propertyValue = this.tempText = '';
			this.propType = 'attr';
			return this.parsePropertyName;
		}
		this.tempText += token;
		return this.parsePropertyValue;
	}


	private popElement() {
		const element = this.stackTrace.pop();
		if (element) {
			const parent = this.stackTrace.pop();
			if (parent && parent instanceof DomElementNode) {
				if (typeof element === 'string') {
					parent.addTextChild(element);
				} else if (element instanceof DomElementNode) {
					parent.addChild(this.checkNode(element));
				} else {
					parent.addChild(element);
				}
				this.stackTrace.push(parent);
			}
			else {
				if (typeof element === 'string') {
					parseTextChild(element).forEach(text => this.childStack.push(text));
				} else if (element instanceof DomElementNode) {
					this.childStack.push(this.checkNode(element));
				} else {
					this.childStack.push(element);
				}
			}
		}
	}

	checkNode(node: DomElementNode): DomElementNode | DomStructuralDirectiveNode {
		const attributes = node.attributes;
		if (attributes) {
			let temp: ElementAttribute<string, any> | ElementAttribute<string, any>[] | undefined;

			temp = attributes.find(attr => attr.name === 'is');
			if (temp) {
				attributes.splice(attributes.indexOf(temp), 1);
				node.is = temp.value as string;
			}
			temp = attributes.filter(attr => {
				return typeof attr.value === 'string' && (/\{\{(.+)\}\}/g).test(attr.value);
			});
			if (temp?.length) {
				temp.forEach(templateAttrs => {
					attributes.splice(attributes.indexOf(templateAttrs), 1);
					node.addTemplateAttr(templateAttrs.name, templateAttrs.value as string);
				});
			}
			temp = attributes.filter(attr => attr.name.startsWith('on'));
			if (temp?.length) {
				temp.forEach(templateAttrs => {
					attributes.splice(attributes.indexOf(templateAttrs), 1);
					node.addOutput(templateAttrs.name.substring(2), templateAttrs.value as string);
				});
			}
			const directiveNames = this.extractAttributeDirectives(node);
			if (directiveNames.length) {
				const directives: DomAttributeDirectiveNode[] = [];
				directiveNames.forEach(namedAttribute => {
					const directive = new DomAttributeDirectiveNode(namedAttribute.name, namedAttribute.value);
					if (directiveRegistry.get(namedAttribute.name)!.hasAttributes()) {
						this.extractDirectiveAttributesFromNode(namedAttribute.name, directive, node);
					}
					directives.push(directive);
				});
				if (directives.length) {
					node.attributeDirectives = directives;
				}
			}

			temp = attributes.find(attr => attr.name.startsWith('*'));
			if (temp) {
				// shorthand syntax
				attributes.splice(attributes.indexOf(temp), 1);
				const isTemplate = node.tagName === 'template';
				const directiveNode = isTemplate ? new DomFragmentNode(node.children) : node;
				const directive = (typeof temp?.value === 'boolean')
					? new DomStructuralDirectiveNode(temp.name, directiveNode)
					: new DomStructuralDirectiveNode(temp.name, directiveNode, String(temp.value));
				const directiveName = temp.name.substring(1);
				if (isTemplate) {
					directive.inputs = node.inputs;
					directive.outputs = node.outputs;
					directive.attributes = node.attributes;
					directive.templateAttrs = node.templateAttrs;
				} else if (directiveRegistry.hasAttributes(directiveName)) {
					this.extractDirectiveAttributesFromNode(directiveName, directive, node);
				}
				return directive;
			}
			if (directiveRegistry.has('*' + node.tagName)) {
				// try to find expression attribute
				// <if expression="a === b">text child<div>...</div></if>
				temp = attributes.find(attr => attr.name === 'expression');
				if (temp) {
					attributes.splice(attributes.indexOf(temp as ElementAttribute<string, string | number | boolean | object>), 1);
				}
				const directiveNode = new DomFragmentNode(node.children);
				const directive = (typeof temp?.value === 'boolean')
					? new DomStructuralDirectiveNode('*' + node.tagName, directiveNode)
					: new DomStructuralDirectiveNode('*' + node.tagName, directiveNode, String(temp?.value));
				// const directive = new DOMDirectiveNode('*' + node.tagName, directiveNode, temp?.value && String(temp.value));
				this.extractDirectiveAttributesFromNode(node.tagName, directive, node);
				return directive;
			}
		} else if (directiveRegistry.has('*' + node.tagName)) {
			// support structural directives without expression property
			// <add-note >text</add-note>
			return new DomStructuralDirectiveNode('*' + node.tagName, new DomFragmentNode(node.children));
		}
		return node;
	}


	private extractDirectiveAttributesFromNode(directiveName: string, directive: BaseNode, node: DomElementNode) {
		const attributes = directiveRegistry.getAttributes(directiveName)!;
		const filterByAttrName = createFilterByAttrName(attributes);
		directive.inputs = node.inputs?.filter(filterByAttrName);
		directive.outputs = node.outputs?.filter(filterByAttrName);
		directive.twoWayBinding = node.twoWayBinding?.filter(filterByAttrName);
		directive.attributes = node.attributes?.filter(filterByAttrName);
		directive.templateAttrs = node.templateAttrs?.filter(filterByAttrName);

		node.inputs && directive.inputs?.forEach(createArrayCleaner(node.inputs));
		node.outputs && directive.outputs?.forEach(createArrayCleaner(node.outputs));
		node.twoWayBinding && directive.twoWayBinding?.forEach(createArrayCleaner(node.twoWayBinding));
		node.attributes && directive.attributes?.forEach(createArrayCleaner(node.attributes));
		node.templateAttrs && directive.templateAttrs?.forEach(createArrayCleaner(node.templateAttrs));
	}

	private extractAttributeDirectives(node: BaseNode): Attribute<any, any>[] {
		const names: Attribute<any, any>[] = [];
		if (node.attributes) {
			names.push(...this.getAttributeDirectives(node.attributes));
		}
		if (node.inputs) {
			names.push(...this.getAttributeDirectives(node.inputs));
		}
		if (node.twoWayBinding) {
			names.push(...this.getAttributeDirectives(node.twoWayBinding));
		}
		if (node.templateAttrs) {
			names.push(...this.getAttributeDirectives(node.templateAttrs));
		}
		if (node.outputs) {
			names.push(...this.getAttributeDirectives(node.outputs));
		}
		return names;
	}
	private getAttributeDirectives(attributes: Attribute<any, any>[]): Attribute<any, any>[] {
		const filtered = directiveRegistry.filterDirectives(attributes.map(attr => attr.name));
		const directives = attributes.filter(attr => filtered.includes(attr.name));
		attributes.forEach(createArrayCleaner(attributes));
		return directives;
	}
}

function createFilterByAttrName(attributes: string[]) {
	return (attr: Attribute<string, any>) => attributes.includes(attr.name);
}

function createArrayCleaner(attributes: Attribute<string, any>[]) {
	return (attr: Attribute<string, any>) => attributes.splice(attributes.indexOf(attr), 1);
}

export class HTMLParser {

	nodeParser = new NodeParser();

	parse(html: string): DomChild[] {
		return this.nodeParser.parse(html);
	}

	toDomRootNode(html: string): DomNode {
		let stack = this.nodeParser.parse(html);
		if (!stack || stack.length === 0) {
			return new DomFragmentNode([new TextContent('')]);
		} else if (stack?.length === 1) {
			return stack[0];
		} else {
			return new DomFragmentNode(stack);
		}
	}

	stringify(stack?: DomNode[]) {
		let html = '';
		stack?.forEach(node => {
			if (node instanceof TextContent) {
				html += node.value;
			} else if (node instanceof LiveTextContent) {
				html += `{{${node.value}}}`;
			} else if (node instanceof CommentNode) {
				html += `<!-- ${node.comment} -->`;
			} else if (node instanceof DomElementNode) {
				let attrs = '';
				if (node.attributes) {
					attrs += node.attributes.map(attr => `${attr.name}="${attr.value}"`).join(' ') + ' ';
				}
				if (node.twoWayBinding) {
					attrs += node.twoWayBinding.map(attr => `[(${attr.name})]="${attr.value}"`).join(' ').concat(' ');
				}
				if (node.inputs) {
					attrs += node.inputs.map(attr => `[${attr.name}]="${attr.value}"`).join(' ').concat(' ');
				}
				if (node.outputs) {
					attrs += node.outputs.map(attr => `(${attr.name})="${attr.value}"`).join(' ').concat(' ');
				}
				if (node.templateAttrs) {
					attrs += node.templateAttrs.map(attr => `${attr.name}="${attr.value}"`).join(' ').concat(' ');
				}
				if (isEmptyElement(node.tagName)) {
					if (attrs) {
						html += `<${node.tagName} ${attrs}/>`;
					} else {
						html += `<${node.tagName} />`;
					}
				} else {
					let children = this.stringify(node.children);
					if (attrs && children) {
						html += `<${node.tagName} ${attrs}>${children}</${node.tagName}>`;
					}
					else if (attrs) {
						html += `<${node.tagName} ${attrs}></${node.tagName}>`;
					} else if (children) {
						html += `<${node.tagName}>${children}<</${node.tagName}>`;
					} else {
						html += `<${node.tagName}></${node.tagName}>`;
					}
				}
			}
		});
		return html;
	}

}

export const htmlParser = new HTMLParser();

