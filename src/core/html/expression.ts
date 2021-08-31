import {
	BaseNode, DOMDirectiveNode, DOMElementNode, DOMFragmentNode, DOMNode,
	DOMParentNode, ElementAttribute, LiveAttribute, LiveTextContent
} from '@ibyar/elements';
import { AssignmentExpression, ExpressionNode, JavaScriptParser, MemberExpression, ThisNode } from '@ibyar/expressions';

const ThisTextContent = JavaScriptParser.parse('this.textContent');
function parseLiveText(text: LiveTextContent<ExpressionNode>) {
	text.expression = new AssignmentExpression('=', ThisTextContent, JavaScriptParser.parse(text.value));
}

function convertToTitleCase(string: string) {
	const dashSplits = string.split('-');
	return dashSplits[0] + dashSplits.splice(1).map(s => (s[0].toUpperCase() + s.substring(1))).join('');
}
function parseLiveAttribute(attr: LiveAttribute<ExpressionNode>) {
	const elementExpression = new MemberExpression(ThisNode, JavaScriptParser.parse(convertToTitleCase(attr.name)), false);
	const modelExpression = JavaScriptParser.parse(attr.value);

	attr.expression = new AssignmentExpression('=', elementExpression, modelExpression);
	attr.callbackExpression = new AssignmentExpression('=', modelExpression, elementExpression);
}

function parseLiveAttributeUpdateElement(attr: LiveAttribute<ExpressionNode>) {
	const elementExpression = new MemberExpression(ThisNode, JavaScriptParser.parse(convertToTitleCase(attr.name)), false);
	const modelExpression = JavaScriptParser.parse(attr.value);
	attr.expression = new AssignmentExpression('=', elementExpression, modelExpression);
}

function parseOutputExpression(attr: ElementAttribute<string, string, ExpressionNode>) {
	attr.expression = JavaScriptParser.parse(attr.value);
}

function parseElementAttribute(attr: ElementAttribute<string, any, ExpressionNode>) {
	attr.expression = JavaScriptParser.parse('this.' + convertToTitleCase(attr.name));
}


function parseBaseNode(base: BaseNode<ExpressionNode>) {
	base.inputs?.forEach(parseLiveAttributeUpdateElement);
	base.outputs?.forEach(parseOutputExpression);
	base.twoWayBinding?.forEach(parseLiveAttribute);
	base.templateAttrs?.forEach(parseLiveAttribute);
	base.attributes?.forEach(parseElementAttribute);
	parseDomParentNode(base);
}

function parseChild(child: DOMNode<ExpressionNode>) {
	if (child instanceof DOMElementNode) {
		// DomElementNode
		parseBaseNode(child);
	} else if (child instanceof DOMDirectiveNode) {
		// DomDirectiveNode
		parseDomParentNode(child);
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
}
