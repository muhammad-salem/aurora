import {
	BaseNode, createLiveAttribute, DOMDirectiveNode,
	DOMDirectiveNodeUpgrade, DOMElementNode, DOMNode,
	DOMFragmentNode, DOMParentNode, ElementAttribute,
	isLiveTextContent, LiveAttribute, LiveTextContent
} from '@ibyar/elements';
import {
	ExpressionNode, Identifier,
	JavaScriptParser, MemberExpression
} from '@ibyar/expressions';
import {
	BindingAssignment,
	OneWayAssignmentExpression,
	TwoWayAssignmentExpression
} from '../binding/binding.expressions.js';
import { DirectiveExpressionParser } from '../directive/parser.js';
import { ClassRegistryProvider } from '../providers/provider.js';

declare module '@ibyar/elements' {
	export interface ElementAttribute<N, V> {
		expression: ExpressionNode;
	}

	export interface LiveAttribute {
		expression: BindingAssignment;
	}

	export interface LiveTextContent {
		expression: OneWayAssignmentExpression;
	}
	export interface DOMDirectiveNodeUpgrade extends DOMDirectiveNode {
		/**
		 * create a new scope for a template and bind the new variables to the directive scope.
		 * 
		 * execution for let-i="index".
		 */
		templateExpressions: ExpressionNode[];
	}
}

const ThisTextContent = JavaScriptParser.parse('this.textContent') as MemberExpression;
function parseLiveText(text: LiveTextContent) {
	const textExpression = JavaScriptParser.parse(text.value);
	text.expression = new OneWayAssignmentExpression(ThisTextContent, textExpression);
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
	if (elementExpression instanceof MemberExpression
		&& (modelExpression instanceof MemberExpression || modelExpression instanceof Identifier)) {
		attr.expression = new TwoWayAssignmentExpression(elementExpression, modelExpression);
	} else {
		console.error(`${attr.name}="${attr.value}"" is not a valid MemberExpression or Identifier 'x.y.z'`);
	}

}

function parseLiveAttributeUpdateElement(attr: LiveAttribute) {
	const elementSource = `this.${convertToMemberAccessStyle(attr.name)}`;
	const elementExpression = JavaScriptParser.parse(elementSource);
	const modelExpression = JavaScriptParser.parse(checkAndValidateObjectSyntax(attr.value));
	if (elementExpression instanceof MemberExpression) {
		attr.expression = new OneWayAssignmentExpression(elementExpression, modelExpression);
	} else {
		console.error(`${attr.name} is not a valid MemberExpression 'x.y.z'`);
	}
}

function parseOutputExpression(attr: ElementAttribute<string, string>) {
	attr.expression = JavaScriptParser.parse(attr.value);
}

function parseBaseNode(base: BaseNode) {
	base.inputs?.forEach(parseLiveAttributeUpdateElement);
	base.outputs?.forEach(parseOutputExpression);
	base.twoWayBinding?.forEach(parseLiveAttribute);
	base.templateAttrs?.forEach(parseLiveAttributeUpdateElement);
}

function parseChild(child: DOMNode) {
	if (child instanceof DOMElementNode) {
		// DomElementNode
		parseBaseNode(child);
		parseDomParentNode(child);
	} else if (child instanceof DOMDirectiveNode) {
		if (child.value) {
			const info = DirectiveExpressionParser.parse(child.name.substring(1), child.value);
			(child as DOMDirectiveNodeUpgrade).templateExpressions = info.templateExpressions.map(JavaScriptParser.parse);
			if (info.directiveInputs.size > 0) {
				const ref = ClassRegistryProvider.getDirectiveRef(child.name);
				if (!ref?.inputs?.length) {
					return;
				}
				child.inputs ??= [];
				info.directiveInputs.forEach((expression, input) => {
					const modelName = ref?.inputs.find(i => i.viewAttribute === input)?.modelProperty ?? input;
					const attr: LiveAttribute = createLiveAttribute(modelName, expression);
					(child.inputs ??= []).push(attr);
				});
			}
		}
		// DomDirectiveNode
		// in case if add input/output support need to handle that here.
		parseChild(child.node);
		parseBaseNode(child);
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
