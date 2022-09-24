import {
	BaseNode, createLiveAttribute,
	DomStructuralDirectiveNode, DomElementNode, DomNode,
	DomFragmentNode, DomParentNode, ElementAttribute,
	isLiveTextContent, LiveAttribute, LiveTextContent,
	DomStructuralDirectiveNodeUpgrade, DomAttributeDirectiveNode
} from '@ibyar/elements';
import {
	ExpressionNode, expressionVisitor, Identifier,
	JavaScriptParser, MemberExpression, PipelineExpression
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
		pipelineNames?: string[];
	}

	export interface LiveTextContent {
		expression: OneWayAssignmentExpression;
		pipelineNames?: string[];
	}
	export interface DomStructuralDirectiveNodeUpgrade extends DomStructuralDirectiveNode {
		/**
		 * create a new scope for a template and bind the new variables to the directive scope.
		 * 
		 * execution for let-i="index".
		 */
		templateExpressions: ExpressionNode[];
	}

	export interface DomAttributeDirectiveNodeUpgrade extends DomAttributeDirectiveNode {

	}
}

const ThisTextContent = JavaScriptParser.parseScript('this.textContent') as MemberExpression;
function parseLiveText(text: LiveTextContent) {
	const textExpression = JavaScriptParser.parseScript(text.value);
	text.expression = new OneWayAssignmentExpression(ThisTextContent, textExpression);
	text.pipelineNames = getPipelineNames(textExpression);
}

function convertToMemberAccessStyle(source: string | string[]): string {
	const dashSplits = Array.isArray(source) ? source : source.split('-');
	if (dashSplits.length === 1) {
		return source as string;
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
	const elementExpression = JavaScriptParser.parseScript(elementSource);
	const modelExpression = JavaScriptParser.parseScript(checkAndValidateObjectSyntax(attr.value));
	if (elementExpression instanceof MemberExpression
		&& (modelExpression instanceof MemberExpression || modelExpression instanceof Identifier)) {
		attr.expression = new TwoWayAssignmentExpression(elementExpression, modelExpression);
	} else {
		console.error(`${attr.name}="${attr.value}"" is not a valid MemberExpression or Identifier 'x.y.z'`);
	}

}

export function getPipelineNames(modelExpression: ExpressionNode): string[] | undefined {
	const pipelineNames: string[] = [];
	expressionVisitor.visit(modelExpression, (expression, type, control) => {
		if (type === 'PipelineExpression') {
			const pipelineName = (expression as PipelineExpression).getRight();
			if (pipelineName instanceof Identifier) {
				pipelineNames.push(pipelineName.getName() as string);
			}
		}
	});
	return pipelineNames.length ? pipelineNames : undefined;
}

function parseLiveAttributeUpdateElement(attr: LiveAttribute) {
	const elementSource = `this.${convertToMemberAccessStyle(attr.name)}`;
	const elementExpression = JavaScriptParser.parseScript(elementSource);
	const modelExpression = JavaScriptParser.parseScript(checkAndValidateObjectSyntax(attr.value));
	if (elementExpression instanceof MemberExpression) {
		attr.expression = new OneWayAssignmentExpression(elementExpression, modelExpression);
	} else {
		console.error(`${attr.name} is not a valid MemberExpression 'x.y.z'`);
	}
	attr.pipelineNames = getPipelineNames(modelExpression);
}

function parseOutputExpression(attr: ElementAttribute<string, string>) {
	attr.expression = JavaScriptParser.parseScript(attr.value);
}

function parseAttributeDirectives(directive: DomAttributeDirectiveNode) {
	directive.inputs?.forEach(parseLiveAttributeUpdateElement);
	directive.outputs?.forEach(parseOutputExpression);
	directive.twoWayBinding?.forEach(parseLiveAttribute);
	directive.templateAttrs?.forEach(parseLiveAttributeUpdateElement);
}

function parseBaseNode(base: BaseNode) {
	base.inputs?.forEach(parseLiveAttributeUpdateElement);
	base.outputs?.forEach(parseOutputExpression);
	base.twoWayBinding?.forEach(parseLiveAttribute);
	base.templateAttrs?.forEach(parseLiveAttributeUpdateElement);
	base.attributeDirectives?.forEach(parseAttributeDirectives);
}

function parseChild(child: DomNode) {
	if (child instanceof DomElementNode) {
		// DomElementNode
		parseBaseNode(child);
		parseDomParentNode(child);
	} else if (child instanceof DomStructuralDirectiveNode) {
		let expressions: ExpressionNode[] = [];
		(child as DomStructuralDirectiveNodeUpgrade).templateExpressions = expressions;
		if (child.value) {
			// use shorthand syntax, possible mixed with input and outputs
			const info = DirectiveExpressionParser.parse(child.name.substring(1), child.value);
			expressions.push(...info.templateExpressions.map(template => JavaScriptParser.parseScript(template)));
			// <div let-i="index">{{item}}</div>

			searchForLetAttributes(child, expressions);

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
		} else {
			searchForLetAttributes(child, expressions);
		}
		// DomDirectiveNode
		// in case if add input/output support need to handle that here.
		parseChild(child.node);
		parseBaseNode(child);
	} else if (isLiveTextContent(child)) {
		parseLiveText(child);
	} else if (child instanceof DomFragmentNode) {
		parseDomParentNode(child);
	}
}

function searchForLetAttributes(child: DomStructuralDirectiveNode, expressions: ExpressionNode[]) {
	const templateExpressionsFromInput = child.attributes?.filter(attr => attr.name.startsWith('let-'));
	templateExpressionsFromInput?.forEach(attr => {
		child.attributes!.splice(child.attributes!.indexOf(attr), 1);
		const attrName = convertToMemberAccessStyle(attr.name.split('-').slice(1));
		const expression = `let ${attrName} = ${(typeof attr.value == 'string') ? attr.value : '$implicit'}`;
		expressions.push(JavaScriptParser.parseScript(expression));
	});
}

function parseDomParentNode(parent: DomParentNode) {
	parent.children?.forEach(parseChild);
}

export function buildExpressionNodes(node: DomNode) {
	if (node instanceof DomFragmentNode) {
		parseDomParentNode(node);
	} else {
		parseChild(node);
	}
}
