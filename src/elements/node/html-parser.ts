import { isEmptyElement } from '../attributes/common.js';
import {
	DomElementNode, CommentNode, parseTextChild,
	TextContent, LiveTextContent, DomFragmentNode,
	DomStructuralDirectiveNode, DomNode, DomChild,
	ElementAttribute, Attribute, BaseNode, LiveAttribute,
	DomParentNode, DomAttributeDirectiveNode,
	DomStructuralDirectiveSuccessorNode,
	LocalTemplateVariables,
} from '../ast/dom.js';
import { directiveRegistry } from '../directives/register-directive.js';

type Token = (token: string) => Token;

type ChildNode = DomElementNode | DomStructuralDirectiveNode | LocalTemplateVariables | CommentNode | string;

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

export class NodeParserHelper {

	protected checkNode(node: DomElementNode): DomElementNode | DomStructuralDirectiveNode {
		if (node instanceof DomStructuralDirectiveNode) {
			return node;
		}
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
		}

		const directiveNames = this.extractDirectiveNames(node);
		let sdName: string | undefined;
		if (directiveNames.length) {
			const directives: DomAttributeDirectiveNode[] = [];
			directiveNames.forEach(attributeName => {
				if (attributeName.startsWith('*')) {
					if (sdName) {
						console.error(`Only one Structural Directive is allowed on an element [${sdName}, ${attributeName}]`);
						return;
					}
					sdName = attributeName;
					return
				}
				const directive = new DomAttributeDirectiveNode(attributeName);
				if (directiveRegistry.get(attributeName)!.hasAttributes()) {
					this.extractDirectiveAttributesFromNode(attributeName, directive, node);
				}
				directives.push(directive);
			});
			if (directives.length) {
				node.attributeDirectives = directives;
			}
		}
		if (sdName) {
			// <div *for [forOf]="array" let-item [trackBy]="method" let-i="index" > {{item}} </div>
			// <div *for="let item of array; let i = index; trackBy=method;" > {{item}} </div>
			// <template #refName *if="isActive; else disabled" > ... </template>
			// <template #disabled > ... </template>

			const temp = node.attributes!.find(attr => attr.name == sdName)!;
			node.attributes!.splice(node.attributes!.indexOf(temp), 1);
			const isTemplate = node.tagName === 'template';

			const directiveNode = isTemplate ? new DomFragmentNode(node.children) : node;
			const directive = new DomStructuralDirectiveNode(
				temp.name,
				directiveNode,
				(typeof temp?.value === 'boolean') ? undefined : String(temp.value)
			);
			const directiveName = temp.name.substring(1);
			if (isTemplate) {
				directive.inputs = node.inputs;
				directive.outputs = node.outputs;
				directive.attributes = node.attributes;
				directive.templateAttrs = node.templateAttrs;
				directive.attributeDirectives = node.attributeDirectives;
			} else if (directiveRegistry.hasAttributes(directiveName)) {
				this.extractDirectiveAttributesFromNode(directiveName, directive, node);
				directive.attributeDirectives = node.attributeDirectives;
			}
			if (isTemplate && node.templateRefName) {
				node.children = [directive];
				return node;
			}
			return directive;
		}

		// <for let-user [of]="users"></for>
		// @for (item of items; track item.id) {
		// 	{ { item.name } }
		// }
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

	protected extractDirectiveAttributesFromNode(directiveName: string, directive: BaseNode, node: DomElementNode): void {
		const attributes = directiveRegistry.getAttributes(directiveName);
		if (!attributes) {
			return;
		}
		const filterByAttrName = createFilterByAttrName(attributes);
		directive.attributes = node.attributes?.filter(filterByAttrName);
		directive.inputs = node.inputs?.filter(filterByAttrName);
		directive.outputs = node.outputs?.filter(filterByAttrName);
		directive.twoWayBinding = node.twoWayBinding?.filter(filterByAttrName);
		directive.templateAttrs = node.templateAttrs?.filter(filterByAttrName);

		node.inputs && directive.inputs?.forEach(createArrayCleaner(node.inputs));
		node.outputs && directive.outputs?.forEach(createArrayCleaner(node.outputs));
		node.twoWayBinding && directive.twoWayBinding?.forEach(createArrayCleaner(node.twoWayBinding));
		node.attributes && directive.attributes?.forEach(createArrayCleaner(node.attributes));
		node.templateAttrs && directive.templateAttrs?.forEach(createArrayCleaner(node.templateAttrs));
	}

	protected extractDirectiveNames(node: BaseNode): string[] {
		const names: string[] = [];
		if (node.attributes?.length) {
			names.push(...this.getAttributeDirectives(node.attributes).filter(name => name.startsWith('*')));
		}
		if (node.inputs?.length) {
			names.push(...this.getAttributeDirectives(node.inputs));
		}
		if (node.twoWayBinding?.length) {
			names.push(...this.getAttributeDirectives(node.twoWayBinding));
		}
		if (node.templateAttrs?.length) {
			names.push(...this.getAttributeDirectives(node.templateAttrs));
		}
		if (node.outputs?.length) {
			names.push(...this.getAttributeDirectives(node.outputs));
		}
		return [...new Set(names)];
	}

	protected getAttributeDirectives(attributes: Attribute<string, any>[]): string[] {
		return directiveRegistry.filterDirectives(attributes.map(attr => attr.name.split('.')[0]));
	}

}

export class NodeParser extends NodeParserHelper {

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

	private skipCount = 0;
	private flowScopeCount = 0;
	private flowChainCount = 0;
	private interpolationCount = 0;
	private insideString?: Record<"'" | '"' | '`', boolean>;

	parse(html: string)/*: DomNode*/ {
		this.reset();
		for (; this.index < html.length; this.index++) {
			this.stateFn = this.stateFn(html[this.index]);
		}
		this.checkTextChild();
		this.popStructuralDirectiveNodes();
		if (this.stackTrace.length > 0) {
			console.error(this.stackTrace);
			throw new Error(`error parsing html, had ${this.stackTrace.length} element, [${(this.stackTrace as DomElementNode[]).map(dom => dom.tagName).join(', ')}], with no closing tag`);
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
		this.skipCount = 0;
		this.flowScopeCount = 0;
		this.flowChainCount = 0;
		this.interpolationCount = 0;
		this.stateFn = this.parseText;
		this.propertyName = this.propertyValue = this.tempText = '';
	}

	private parseText(token: string) {
		if (token === '<' || token === '@') {
			if (token === '@' && this.tempText.at(-1) === '\\') {
				this.tempText = this.tempText.substring(0, this.tempText.length - 2) + token;
				return this.parseText;
			} else {
				this.checkTextChild();
				return token === '<' ? this.parseTag : this.parseControlFlow;
			}
		}
		else if (this.interpolationCount === 0 && this.flowScopeCount > 0 && token === '}') {
			this.checkTextChild();
			this.tempText = '';
			this.flowScopeCount--;
			const directive = this.getLastStructuralDirectiveNode();
			if (directive) {
				const lastDirective = chainSuccessor(directive);
				const names = lastDirective.successors?.map(successor => successor.name) ?? [];
				if (!directiveRegistry.hasAllSuccessors(lastDirective.name, names)) {
					this.flowChainCount++;
					return this.parsePossibleSuccessorsControlFlow;
				}
				do {
					this.flowChainCount--;
					this.popElement();
				} while (this.flowChainCount > 0);
			}
			return this.parseText;
		} else if (token === '{') {
			this.interpolationCount++;
		} else if (token === '}') {
			this.interpolationCount--;
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
		else if (token === '>' && this.commentCloseCount === 0) {
			const temp = this.tempText.toLowerCase();
			if ('doctype html' === temp) {
				this.tempText = '';
				return this.parseText;
			}
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
				throw new Error(`Wrong closed tag at char ${this.index}, tag name: ${this.currentNode.tagName}`);
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
		throw new SyntaxError('Error while parsing open tag');
	}

	private parsePropertyName(token: string) {
		if (token === '>') {
			if (this.tempText.trim()) {
				this.propertyName = this.tempText;
				this.currentNode.addAttribute(this.propertyName, true);
				this.propertyName = this.propertyValue = this.tempText = '';
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

	private parseControlFlow(token: string) {
		if (token === '(') {
			const flowName = '*' + this.tempText.trim();
			this.stackTrace.push(new DomStructuralDirectiveNode(flowName, new DomFragmentNode()));
			this.tempText = '';
			this.skipCount = 1;
			return this.parseControlFlowExpression;
		} else if (token === '{') {
			if (this.tempText.trim()) {
				const flowName = '*' + this.tempText.trim();
				this.stackTrace.push(new DomStructuralDirectiveNode(flowName, new DomFragmentNode()));
			}
			this.skipCount = 0;
			this.tempText = '';
			this.flowScopeCount++;
			return this.parseText;
		}
		this.tempText += token;
		if (this.tempText.trim() === 'let') {
			this.tempText = '';
			this.insideString = {
				"'": false,
				'"': false,
				'`': false
			};
			return this.parseLocalTemplateVariables;
		}
		return this.parseControlFlow;
	}

	private parseControlFlowExpression(token: string) {
		if (token === ')') {
			this.skipCount--;
			if (this.skipCount == 0 && this.currentNode instanceof DomStructuralDirectiveNode) {
				this.currentNode.value = this.tempText;
				this.tempText = '';
				return this.parseControlFlow;
			}
		} else if (token === '(') {
			this.skipCount++;
		}
		this.tempText += token;
		return this.parseControlFlowExpression;
	}

	private parsePossibleSuccessorsControlFlow(token: string) {
		if (/\s/.test(token)) {
			this.tempText += token;
			return this.parsePossibleSuccessorsControlFlow;
		}
		if (token === '@') {
			this.tempText = '';
			return this.parsePossibleSuccessorsControlFlowName;
		}
		do {
			this.flowChainCount--;
			this.popElement();
		} while (this.flowChainCount > 0);
		this.index--;
		return this.parseText;
	}

	private parsePossibleSuccessorsControlFlowName(token: string) {
		if (/\s/.test(token) || token === '{') {
			const successorFlowName = '*' + this.tempText.trim();
			const directive = this.getLastStructuralDirectiveNode();
			if (directive) {
				const isSuccessor = directiveRegistry.hasSuccessor(directive.name, successorFlowName);
				if (isSuccessor) {
					(directive.successors ??= []).push(new DomStructuralDirectiveSuccessorNode(successorFlowName));
					this.tempText = '';
					this.index--;
					return this.parseSuccessorsControlFlowName;
				}
			}
			this.tempText += token;
			return this.parseText;
		} else if (token === '(') {
			this.popStructuralDirectiveNodes();
			this.index--;
			return this.parseControlFlow;
		}
		this.tempText += token;
		return this.parsePossibleSuccessorsControlFlowName;
	}

	private parseSuccessorsControlFlowName(token: string) {
		if (token === '(' || token === '{') {
			this.index--;
			return this.parseControlFlow;
		}
		this.tempText += token;
		return this.parseSuccessorsControlFlowName;
	}

	private parseLocalTemplateVariables(token: string) {
		if ((token == '"' || token === "'" || token === '`') && this.tempText.at(-1) !== '\\') {
			this.insideString![token] = !this.insideString![token];
		} else if (token === ';' && !this.insideString?.['"'] && !this.insideString?.['`'] && !this.insideString?.["'"]) {
			const expression = this.tempText.trim();
			this.stackTrace.push(new LocalTemplateVariables(expression));
			this.popElement();
			this.tempText = '';
			this.insideString = undefined;
			return this.parseText;
		}
		this.tempText += token;
		return this.parseLocalTemplateVariables;
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

	private checkTextChild() {
		if (this.tempText) {
			this.tempText = this.escaper.unescape(this.tempText);
			this.stackTrace.push(this.tempText);
			this.popElement();
			this.tempText = '';
		}
	}

	private popStructuralDirectiveNodes() {
		while (this.currentNode instanceof DomStructuralDirectiveNode) {
			this.popElement();
		}
	}

	private popElement() {
		const element = this.stackTrace.pop();
		if (!element) {
			return;
		}
		let parent: ChildNode | DomFragmentNode | undefined = this.stackTrace.pop();
		let directive: DomStructuralDirectiveNode | undefined;
		if (parent instanceof DomStructuralDirectiveNode && parent.node instanceof DomFragmentNode) {
			directive = parent;
			parent = parent.successors?.at(-1) ?? parent.node ?? parent;
		}
		if (parent instanceof DomParentNode) {
			if (typeof element === 'string') {
				parent.addTextChild(element);
			} else if (element instanceof DomElementNode) {
				parent.addChild(this.checkNode(element));
			} else {
				parent.addChild(element)
			}
			this.stackTrace.push(directive ?? parent as ChildNode);
		} else {
			if (typeof element === 'string') {
				parseTextChild(element).forEach(text => this.childStack.push(text));
			} else if (element instanceof DomElementNode) {
				const child = this.checkNode(element);
				this.childStack.push(child);
			}
			else {
				this.childStack.push(element);
			}
		}
	}

	private getLastStructuralDirectiveNode() {
		for (let i = this.stackTrace.length - 1; i >= 0; i--) {
			const el = this.stackTrace[i];
			if (el instanceof DomStructuralDirectiveNode) {
				return el;
			}
		}
		for (let i = this.childStack.length - 1; i >= 0; i--) {
			const el = this.childStack[i];
			if (el instanceof DomStructuralDirectiveNode) {
				return el;
			}
		}
		return undefined;
	}

}

function chainSuccessor(directive: DomStructuralDirectiveNode): DomStructuralDirectiveNode {
	if (!directive.successors?.length) {
		return directive;
	}
	const successor = directive.successors.at(-1);
	if (successor instanceof DomStructuralDirectiveSuccessorNode
		&& successor.children[0] instanceof DomStructuralDirectiveNode) {
		return chainSuccessor(successor.children[0]);
	}
	return directive;
}

function createFilterByAttrName(attributes: string[]) {
	return (attr: Attribute<string, any>) => attributes.includes(attr.name.split('.')[0]);
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

	stringify(stack?: DomNode | DomNode[]) {
		if (!Array.isArray(stack)) {
			stack = stack ? [stack] : [];
		}
		let html = '';
		stack.forEach(node => {
			if (node instanceof LiveTextContent) {
				html += `{{${node.value}}}`;
			} else if (node instanceof TextContent) {
				html += node.value;
			} else if (node instanceof CommentNode) {
				html += `<!-- ${node.comment} -->`;
			} else if (node instanceof LocalTemplateVariables) {
				html += `@let ${node.declarations};`;
			} else if (node instanceof DomFragmentNode) {
				html += this.stringify(node.children);
			} else if (node instanceof DomStructuralDirectiveNode) {
				html += `@${node.name.substring(1)}${node.value ? ` (${node.value})` : ''} {${this.stringify([node.node])}}${Array.isArray(node.successors) ? this.stringify(node.successors) : ''}`;
				html += this.stringify([node.node]);
			} else if (node instanceof DomStructuralDirectiveSuccessorNode) {
				html += `@${node.name}`;
				if (node.children.length === 1 && node.children[0] instanceof DomStructuralDirectiveNode) {
					html += this.stringify(node.children).substring(1);
				} else {
					html += this.stringify(node.children);
				}
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

	deserializeAttributes(attribute: Attribute<any, any>) {
		const type = (attribute as Attribute<any, any> & { type: string }).type;
		switch (type) {
			case 'Attribute':
				inherit(attribute, Attribute);
				break;
			case 'ElementAttribute':
				inherit(attribute, ElementAttribute);
				break;
			case 'LiveAttribute':
				inherit(attribute, LiveAttribute);
				break;
			case 'TextContent':
				inherit(attribute, TextContent);
				break;
			case 'LiveTextContent':
				inherit(attribute, LiveTextContent);
				break;
			default:
				break;
		}
	}

	deserializeBaseNode(node: BaseNode) {
		node.attributes?.forEach(attr => this.deserializeAttributes(attr));
		node.inputs?.forEach(attr => this.deserializeAttributes(attr));
		node.outputs?.forEach(attr => this.deserializeAttributes(attr));
		node.templateAttrs?.forEach(attr => this.deserializeAttributes(attr));
		node.attributeDirectives?.forEach(attr => this.deserializeNode(attr as any));
	}

	deserializeNode(node: DomNode) {
		const type = (node as DomNode & { type: string }).type;
		switch (type) {
			case 'TextContent':
				inherit(node, TextContent);
				break;
			case 'LiveTextContent':
				inherit(node, LiveTextContent);
				break;
			case 'CommentNode':
				inherit(node, CommentNode);
				break;
			case 'LocalTemplateVariables':
				inherit(node, LocalTemplateVariables);
				break;
			case 'DomFragmentNode':
				inherit(node, DomFragmentNode);
				(node as DomFragmentNode).children?.forEach(child => this.deserializeNode(child));
				break;
			case 'DomElementNode':
				inherit(node, DomElementNode);
				if ((node as DomElementNode).templateRefName) {
					this.deserializeAttributes((node as DomElementNode).templateRefName!);
				}
				this.deserializeBaseNode(node as DomElementNode);
				(node as DomElementNode).children?.forEach(child => this.deserializeNode(child));
				break;
			case 'DomStructuralDirectiveNode':
				inherit(node, DomStructuralDirectiveNode);
				this.deserializeBaseNode(node as DomStructuralDirectiveNode);
				this.deserializeNode((node as DomStructuralDirectiveNode).node);
				const successors = (node as DomStructuralDirectiveNode).successors;
				if (successors) {
					successors.forEach(successor => this.deserializeNode(successor));
				}
				break;
			case 'StructuralDirectiveSuccessorNode':
				inherit(node, DomStructuralDirectiveSuccessorNode);
				(node as DomStructuralDirectiveSuccessorNode).children?.forEach(child => this.deserializeNode(child));
				break;
			case 'DomAttributeDirectiveNode':
				inherit(node, DomAttributeDirectiveNode);
				this.deserializeBaseNode(node as DomAttributeDirectiveNode);
				break;
			default:
				break;
		}
		return node;
	}

}

function inherit(object: any, type: { new(...args: any[]): {} }) {
	object.__proto__ = type.prototype;
}

export const htmlParser = new HTMLParser();

