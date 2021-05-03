import {
	BaseNode, DOMChild, DOMFragmentNode,
	DOMNode, DOMParentNode, LiveAttribute, LiveTextContent
} from '@ibyar/elements';
import { ExpressionNode, IdentifierNode } from '@ibyar/expressions';
import { JavaScriptParser } from '@ibyar/expressions';

const TextContent = new IdentifierNode('textContent');
function parseLiveText(text: LiveTextContent<ExpressionNode>) {
	text.nameNode = TextContent;
	text.valueNode = JavaScriptParser.parse(text.value);
}

function parseLiveAttribute(attr: LiveAttribute<ExpressionNode>) {
	attr.nameNode = JavaScriptParser.parse(attr.name);
	attr.valueNode = JavaScriptParser.parse(attr.value);
}

function parseBaseNode(base: BaseNode<ExpressionNode>) {
	base.templateRefName && parseLiveAttribute(base.templateRefName);
	base.inputs?.forEach(parseLiveAttribute);
	base.outputs?.forEach(parseLiveAttribute);
	base.twoWayBinding?.forEach(parseLiveAttribute);
	base.templateAttrs?.forEach(parseLiveAttribute);
	parseDomParentNode(base);
}

function parseChild(child: DOMChild<ExpressionNode>) {
	if (child instanceof BaseNode) {
		// DomElementNode & DomDirectiveNode
		parseBaseNode(child);
	} else if (child instanceof LiveTextContent) {
		parseLiveText(child);
	}
}
function parseDomParentNode(parent: DOMParentNode<ExpressionNode>) {
	parent.children?.forEach(parseChild);
}

export function buildExpressionNodes(node: DOMNode<ExpressionNode>) {
	if (node instanceof DOMFragmentNode) {
		parseDomParentNode(node);
	} else {
		parseChild(node);
	}
	console.log(node);
}
