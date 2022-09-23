/// <reference path="../types/index.ts" />

import {
	DomChild, DomElementNode, DomStructuralDirectiveNode,
	DomFragmentNode, NodeParserHelper, LiveTextContent,
	TextContent, directiveRegistry, DomAttributeDirectiveNode, LiveAttribute
} from '@ibyar/elements';

import { ComponentRef, ReflectComponents } from '@ibyar/core';

export const Fragment = 'fragment';


/**
 * <div target="[(expression)]" click-event="(onclick())" name="user_[[user.name]]">normal text [[bind.text]]</div>
 */
export interface ElementProperties {
	[attribute: string]: string | boolean | number | null | undefined,
	is?: string;
};

export class JsxParser extends NodeParserHelper {

	createElement(tagName: typeof Fragment, props?: ElementProperties, ...children: (string | DomChild)[]): DomFragmentNode;
	createElement(tagName: string, props?: ElementProperties, ...children: (string | DomChild)[]): DomElementNode | DomStructuralDirectiveNode;
	createElement(tagName: string | Function, props?: ElementProperties, ...children: (string | DomChild)[]): DomFragmentNode | DomElementNode | DomStructuralDirectiveNode {
		let node: DomElementNode | undefined;
		if (typeof tagName == 'string') {
			if (Fragment === tagName.toLowerCase()) {
				return this.createFragmentNode(...children);
			}
			node = new DomElementNode(tagName, props?.is);
		}
		else if (typeof tagName == 'function') {
			if (props?.is) {
				// ignore model class
				node = new DomElementNode(props.is);
			} else {
				// search for component selector
				const componentRef: ComponentRef<any> = ReflectComponents.getComponentRef(tagName);
				node = new DomElementNode(componentRef.selector);
			}
		}
		if (props?.is) {
			delete props.is;
		}
		if (!node) {
			throw new Error('Invalid tag name.');
		}

		if (props) {
			const attributes = Object.keys(props);

			let temp: string | string[] | undefined;
			temp = attributes.find(name => name.startsWith('#'));
			if (temp) {
				node.setTemplateRefName(temp.substring(1), props[temp] as string);
				attributes.splice(attributes.indexOf(temp), 1);
				delete props[temp];
			}

			temp = attributes.filter(name => {
				const value = props[name];
				return typeof value === 'string' && (/\[\[(.+)\]\]/g).test(value);
			});
			if (temp?.length) {
				temp.forEach(name => {
					this.addTemplateAttr(node!, name, props[name] as string);
					attributes.splice(attributes.indexOf(name), 1);
					delete props[name];
				});
			}
			temp = attributes.filter(name => name.startsWith('on'));
			if (temp?.length) {
				temp.forEach(name => {
					node!.addOutput(name.substring(2), props[name] as string);
					attributes.splice(attributes.indexOf(name), 1);
					delete props[name];
				});
			}
		}
		const directiveNames = this.extractDirectiveNames(node);
		if (directiveNames.length) {
			const directives: DomAttributeDirectiveNode[] = [];
			directiveNames.forEach(attributeName => {
				if (attributeName.startsWith('*')) {
					throw new Error('Invalid attribute name. sx syntax can\'t support * directive shorthand syntax');
				}
				const directive = new DomAttributeDirectiveNode(attributeName);
				if (directiveRegistry.get(attributeName)!.hasAttributes()) {
					this.extractDirectiveAttributesFromNode(attributeName, directive, node!);
				}
				directives.push(directive);
			});
			if (directives.length) {
				node.attributeDirectives = directives;
			}
		}
		// <for let-user of="[users]"></for>
		if (directiveRegistry.has('*' + node.tagName)) {
			const children = new DomFragmentNode(node.children);
			const directive = new DomStructuralDirectiveNode('*' + node.tagName, children);
			directive.inputs = node.inputs;
			directive.outputs = node.outputs;
			directive.attributes = node.attributes;
			directive.templateAttrs = node.templateAttrs;
			directive.attributeDirectives = node.attributeDirectives;
			return directive;
		}

		return node;
	}

	protected createFragmentNode(...children: (string | DomChild)[]) {
		let childStack = children.flatMap(child => {
			if (typeof child === 'string') {
				return this.parseTextChild(child);
			} else {
				return [child];
			}
		});
		return new DomFragmentNode(childStack);
	}

	protected parseTextChild(text: string): Array<TextContent | LiveTextContent> {
		// split from end with ']]', then search for the first '[['
		let all: (TextContent | LiveTextContent)[] = [];
		let temp = text;
		let last = temp.lastIndexOf(']]');
		let first: number;
		while (last > -1) {
			first = text.lastIndexOf('[[', last);
			if (first > -1) {
				let lastPart = temp.substring(last + 2);
				if (lastPart) {
					all.push(new TextContent(lastPart));
				}
				const liveText = new LiveTextContent(temp.substring(first + 2, last));
				all.push(liveText);
				temp = temp.substring(0, first);
				last = temp.lastIndexOf(']]');
			} else {
				break;
			}
		}
		if (temp) {
			all.push(new TextContent(temp));
		}
		return all.reverse();
	}

	protected addTemplateAttr(node: DomElementNode, attrName: string, valueSource: string) {
		valueSource = valueSource.trim();
		if (/^\[\[(.+)\]\]$/g.test(valueSource)) {
			// as one way binding
			const substring = valueSource.substring(2, valueSource.length - 2);
			if (!(/\[\[(.+)\]\]/g).test(substring)) {
				node.addInput(attrName, substring);
				return;
			}
		}
		// as string 
		valueSource = this.parseStringTemplate(valueSource);
		if (node.templateAttrs) {
			node.templateAttrs.push(new LiveAttribute(attrName, valueSource));
		} else {
			node.templateAttrs = [new LiveAttribute(attrName, valueSource)];
		}
	}

	protected parseStringTemplate(text: string): string {
		const node = this.parseTextChild(text);
		const map = node.map(str => (str instanceof LiveTextContent ? '${' + str.value + '}' : str.value)).join('');
		return '`' + map + '`';
	}

}


export const jsxParser = new JsxParser();
export default jsxParser;
