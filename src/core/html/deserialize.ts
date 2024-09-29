import {
	BaseNode, DomStructuralDirectiveNode, DomElementNode, DomNode,
	DomFragmentNode, DomParentNode, ElementAttribute,
	isLiveTextContent, LiveAttribute, LiveTextContent,
	DomAttributeDirectiveNode, LocalTemplateVariables
} from '@ibyar/elements';

import type { DomStructuralDirectiveNodeUpgrade } from '@ibyar/elements/node.js';
import { deserialize } from '@ibyar/expressions';
import { getPipelineNames } from './expression.js';

function deserializeLiveText(text: LiveTextContent) {
	if (text.expression) {
		text.expression = deserialize(text.expression) as typeof text.expression;
		text.pipelineNames = getPipelineNames(text.expression.getRight());
	}
}

function deserializeLocalTemplateVariables(local: LocalTemplateVariables) {
	local.variables?.forEach(variable => {
		variable.expression = deserialize(variable.expression) as typeof variable.expression;
		variable.pipelineNames = getPipelineNames(variable.expression.getRight());
	});
}

function deserializeLiveAttribute(attr: LiveAttribute) {
	if (attr.expression) {
		attr.expression = deserialize(attr.expression) as typeof attr.expression;
	}
}

function deserializeLiveAttributeUpdateElement(attr: LiveAttribute) {
	if (attr.expression) {
		attr.expression = deserialize(attr.expression) as typeof attr.expression;
		attr.pipelineNames = getPipelineNames(attr.expression.getRight());
	}
}

function deserializeOutputExpression(attr: ElementAttribute<string, string>) {
	if (attr.expression) {
		attr.expression = deserialize(attr.expression) as typeof attr.expression;
	}
}

function deserializeAttributeDirectives(directive: DomAttributeDirectiveNode) {
	directive.inputs?.forEach(deserializeLiveAttributeUpdateElement);
	directive.outputs?.forEach(deserializeOutputExpression);
	directive.twoWayBinding?.forEach(deserializeLiveAttribute);
	directive.templateAttrs?.forEach(deserializeLiveAttributeUpdateElement);
}

function deserializeBaseNode(base: BaseNode) {
	base.inputs?.forEach(deserializeLiveAttributeUpdateElement);
	base.outputs?.forEach(deserializeOutputExpression);
	base.twoWayBinding?.forEach(deserializeLiveAttribute);
	base.templateAttrs?.forEach(deserializeLiveAttributeUpdateElement);
	base.attributeDirectives?.forEach(deserializeAttributeDirectives);
}

function deserializeChild(child: DomNode) {
	if (child instanceof DomElementNode) {
		// DomElementNode
		deserializeBaseNode(child);
		deserializeDomParentNode(child);
	} else if (child instanceof DomStructuralDirectiveNode) {
		(child as DomStructuralDirectiveNodeUpgrade).templateExpressions = (child as DomStructuralDirectiveNodeUpgrade).templateExpressions?.map(deserialize) ?? [];
		deserializeChild(child.node);
		deserializeBaseNode(child);
		child.successors?.forEach(deserializeChild);
	} else if (isLiveTextContent(child)) {
		deserializeLiveText(child);
	} else if (child instanceof DomFragmentNode) {
		deserializeDomParentNode(child);
	} else if (child instanceof LocalTemplateVariables) {
		deserializeLocalTemplateVariables(child);
	}
}

function deserializeDomParentNode(parent: DomParentNode) {
	parent.children?.forEach(deserializeChild);
}

export function deserializeExpressionNodes(node: DomNode) {
	if (node instanceof DomFragmentNode) {
		deserializeDomParentNode(node);
	} else {
		deserializeChild(node);
	}
}
