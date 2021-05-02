import {
	BaseNode, DomChild, DomFragmentNode, DomNode,
	DomParentNode, LiveAttribute, LiveEvent, LiveTextNode
} from '@ibyar/elements';
import type { ExpressionNode } from '@ibyar/expressions/api';
import { JavaScriptParser } from '@ibyar/expressions';

function parseLiveText(text: LiveTextNode<ExpressionNode>) {
	text.textNode = JavaScriptParser.parse(text.textValue);
}

function parseLiveEvent(event: LiveEvent<ExpressionNode>) {
	event.eventNode = JavaScriptParser.parse(event.eventName);
	if (typeof event.sourceHandler === 'string') {
		event.sourceNode = JavaScriptParser.parse(event.sourceHandler);
	}
}

function parseLiveAttribute(attr: LiveAttribute<ExpressionNode>) {
	attr.attrNode = JavaScriptParser.parse(attr.attrName);
	attr.sourceNode = JavaScriptParser.parse(attr.sourceValue);
}

function parseBaseNode(base: BaseNode<ExpressionNode>) {
	base.templateRefName && parseLiveAttribute(base.templateRefName);
	base.inputs?.forEach(parseLiveAttribute);
	base.outputs?.forEach(parseLiveEvent);
	base.twoWayBinding?.forEach(parseLiveAttribute);
	base.templateAttrs?.forEach(parseLiveAttribute);
	parseDomParentNode(base);
}

function parseChild(child: DomChild<ExpressionNode>) {
	if (child instanceof BaseNode) {
		// DomElementNode & DomDirectiveNode
		parseBaseNode(child);
	} else if (child instanceof LiveTextNode) {
		parseLiveText(child);
	}
}
function parseDomParentNode(parent: DomParentNode<ExpressionNode>) {
	parent.children?.forEach(parseChild);
}

export function buildExpressionNodes(node: DomNode<ExpressionNode>) {
	if (node instanceof DomFragmentNode) {
		parseDomParentNode(node);
	} else {
		parseChild(node);
	}
	console.log(node);
}
