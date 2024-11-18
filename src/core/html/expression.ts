import {
	BaseNode, createLiveAttribute,
	DomStructuralDirectiveNode, DomElementNode, DomNode,
	DomFragmentNode, DomParentNode, ElementAttribute,
	isLiveTextContent, LiveAttribute, LiveTextContent,
	DomStructuralDirectiveNodeUpgrade, DomAttributeDirectiveNode,
	LocalTemplateVariables, isLocalTemplateVariables
} from '@ibyar/elements/node.js';
import {
	Identifier,
	ExpressionNode,
	MemberExpression,
	JavaScriptParser,
	expressionVisitor,
	PipelineExpression,
	VariableDeclarationNode
} from '@ibyar/expressions';
import {
	OneWayAssignmentExpression,
	TwoWayAssignmentExpression
} from '../binding/binding.expressions.js';
import { DirectiveExpressionParser } from '../directive/parser.js';
import { classRegistryProvider } from '../providers/provider.js';

const ThisTextContent = JavaScriptParser.parseScript('this.textContent') as MemberExpression;
function parseLiveText(text: LiveTextContent) {
	const textExpression = JavaScriptParser.parseScript(text.value);
	text.expression = new OneWayAssignmentExpression(ThisTextContent, textExpression);
	text.pipelineNames = getPipelineNames(textExpression);
}

function parseLocalTemplateVariables(local: LocalTemplateVariables) {
	const expression = JavaScriptParser.parseScript<VariableDeclarationNode>(`let ${local.declarations}`);
	local.variables = expression.getDeclarations().map(declaration => {
		const expression = new OneWayAssignmentExpression(declaration.getId(), declaration.getInit()!);
		const pipelineNames = getPipelineNames(expression.getRight());
		return { expression, pipelineNames };
	});
}

/**
 * user-name ==> userName
 * 
 * @param source 
 * @returns 
 */
function convertToMemberAccessStyle(source: string | string[]): string {
	const dashSplits = Array.isArray(source) ? source : source.split('-');
	if (dashSplits.length === 1) {
		return source as string;
	}
	return dashSplits[0] + dashSplits.splice(1).map(s => (s[0].toUpperCase() + s.substring(1))).join('');
}

function getAccessNotation(property: string) {
	if (property.includes('-')) {
		return [`['`, property, `']`];
	} else if (Number.isInteger(property.at(0))) {
		return ['[', property, ']'];
	}
	return ['.', property];
}

/**
 * user.tel-number ==> user['tel-number']
 * 
 * @param source 
 * @returns 
 */
function escapeMemberExpression(source: string | string[]): string {
	const dashSplits = Array.isArray(source) ? source : source.split('.');
	return dashSplits.flatMap(property => getAccessNotation(property)).join('');
}

/**
 * warp js code with `()` if necessary
 * 
 * `{name: 'alex'}` will be `({name: 'alex'})`
 * 
 * @param params 
 */
function checkAndValidateObjectSyntax(source: string) {
	if (source.trimStart().startsWith('{')) {
		return `(${source})`;
	}
	return source;
}
function parseLiveAttribute(attr: LiveAttribute) {
	const elementSource = `this${escapeMemberExpression(attr.name)}`;
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
	let left = attr.name;
	let right = attr.value;
	if (attr.name.startsWith('data-')) {
		left = `this.dataset.${convertToMemberAccessStyle(attr.name.substring(5))}`;
	} else {
		left = `this${escapeMemberExpression(attr.name)}`;
		const elements = left.split(/\.|\[|]/);
		if (elements.length > 2) {
			left = `this${escapeMemberExpression(elements[1])}`;
			right = `({${elements[2]}: ${right}})`;
		}
	}
	const elementExpression = JavaScriptParser.parseScript(left);
	const modelExpression = JavaScriptParser.parseScript(checkAndValidateObjectSyntax(right));
	if (elementExpression instanceof MemberExpression) {
		attr.expression = new OneWayAssignmentExpression(elementExpression, modelExpression);
	} else {
		console.error(`[${attr.name}] is not a valid MemberExpression 'x.y.z'`);
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
		const expressions: ExpressionNode[] = [];
		(child as DomStructuralDirectiveNodeUpgrade).templateExpressions = expressions;
		if (child.value) {
			// use shorthand syntax, possible mixed with input and outputs
			const info = DirectiveExpressionParser.parse(child.name.substring(1), child.value);
			expressions.push(...info.templateExpressions.map(template => JavaScriptParser.parseScript(template)));
			// <div let-i="index">{{item}}</div>

			searchForLetAttributes(child, expressions);

			if (info.directiveInputs.size > 0) {
				const ref = classRegistryProvider.getDirectiveRef(child.name);
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
		child.successors?.forEach(parseChild);
	} else if (isLiveTextContent(child)) {
		parseLiveText(child);
	} else if (isLocalTemplateVariables(child)) {
		parseLocalTemplateVariables(child);
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

/**
 * function to skip node checking
 * @param modelClass 
 */
export function provideDirective(modelClass: Record<string, any>) {
	classRegistryProvider.registerDirective(modelClass as any);
}

export function deleteDirective(selector: string) {
	classRegistryProvider.deleteDirective(selector);
}
