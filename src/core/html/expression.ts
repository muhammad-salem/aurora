import {
	BaseNode, DOMDirectiveNode, DOMElementNode, DOMFragmentNode, DOMNode,
	DOMParentNode, ElementAttribute, isLiveTextContent, LiveAttribute, LiveTextContent
} from '@ibyar/elements';
import { AssignmentExpression, ExpressionEventMap, ExpressionNode, JavaScriptParser } from '@ibyar/expressions';
import { HTMLNodeAssignmentExpression, TextNodeAssignmentExpression } from './update.js';

declare module '@ibyar/elements' {
	export interface ElementAttribute<N, V> {
		expression: ExpressionNode;
		expressionEvent: ExpressionEventMap;
	}

	export interface LiveAttribute {
		expression: ExpressionNode;
		expressionEvent: ExpressionEventMap;
		callbackExpression: ExpressionNode;
		callbackExpressionEvent: ExpressionEventMap;
	}

	export interface LiveTextContent {
		expression: ExpressionNode;
		expressionEvent: ExpressionEventMap;
	}
}

const ThisTextContent = JavaScriptParser.parse('this.textContent');
function parseLiveText(text: LiveTextContent) {
	const textExpression = JavaScriptParser.parse(text.value);
	text.expression = new TextNodeAssignmentExpression(ThisTextContent, textExpression);

	text.expressionEvent = textExpression.events();
}

function convertToMemberAccessStyle(source: string) {
	const dashSplits = source.split('-');
	if (dashSplits.length === 1) {
		return source;
	}
	return dashSplits[0] + dashSplits.splice(1).map(s => (s[0].toUpperCase() + s.substring(1))).join('');
}

/**
 * warp js code with `()` if necessary
 * 
 * `{name: 'alex'}` will be `({name: 'alex'})`
 * 
 * @param params 
 */
function checkAndValidateObjectSyntax(source: string) {
	if (source.startsWith('{')) {
		return `(${source})`;
	}
	return source;
}
function parseLiveAttribute(attr: LiveAttribute) {
	const elementSource = `this.${convertToMemberAccessStyle(attr.name)}`;
	const elementExpression = JavaScriptParser.parse(elementSource);
	const modelExpression = JavaScriptParser.parse(checkAndValidateObjectSyntax(attr.value));

	attr.expression = new HTMLNodeAssignmentExpression(elementExpression, modelExpression);
	attr.callbackExpression = new AssignmentExpression('=', modelExpression, elementExpression);

	attr.expressionEvent = modelExpression.events();
	attr.callbackExpressionEvent = elementExpression.events();
}

function parseLiveAttributeUpdateElement(attr: LiveAttribute) {
	const elementSource = `this.${convertToMemberAccessStyle(attr.name)}`;
	const elementExpression = JavaScriptParser.parse(elementSource);
	const modelExpression = JavaScriptParser.parse(checkAndValidateObjectSyntax(attr.value));
	attr.expression = new HTMLNodeAssignmentExpression(elementExpression, modelExpression);

	attr.expressionEvent = modelExpression.events();
}

function parseOutputExpression(attr: ElementAttribute<string, string>) {
	attr.expression = JavaScriptParser.parse(attr.value);
}

function parseElementAttribute(attr: ElementAttribute<string, any>) {
	attr.expression = JavaScriptParser.parse('this.' + convertToMemberAccessStyle(attr.name));
}


function parseBaseNode(base: BaseNode) {
	base.inputs?.forEach(parseLiveAttributeUpdateElement);
	base.outputs?.forEach(parseOutputExpression);
	base.twoWayBinding?.forEach(parseLiveAttribute);
	base.templateAttrs?.forEach(parseLiveAttribute);
	base.attributes?.forEach(parseElementAttribute);
	parseDomParentNode(base);
}

function parseChild(child: DOMNode) {
	if (child instanceof DOMElementNode) {
		// DomElementNode
		parseBaseNode(child);
	} else if (child instanceof DOMDirectiveNode) {
		// DomDirectiveNode
		// in case if add input/output support need to handle that here.
		parseChild(child.node);
	} else if (isLiveTextContent(child)) {
		parseLiveText(child);
	} else if (child instanceof DOMFragmentNode) {
		parseDomParentNode(child);
	}
}
function parseDomParentNode(parent: DOMParentNode) {
	parent.children?.forEach(parseChild);
}

export function buildExpressionNodes(node: DOMNode) {
	if (node instanceof DOMFragmentNode) {
		parseDomParentNode(node);
	} else {
		parseChild(node);
	}
}
