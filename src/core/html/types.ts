import type { DomAttributeDirectiveNode, DomStructuralDirectiveNode } from '@ibyar/elements';
import type { ExpressionNode } from '@ibyar/expressions';
import type { BindingAssignment, OneWayAssignmentExpression } from '../binding/binding.expressions.js';

declare module '@ibyar/elements/node.js' {
	interface ElementAttribute<N, V> {
		expression: ExpressionNode;
	}

	interface LiveAttribute {
		expression: BindingAssignment;
		pipelineNames?: string[];
	}

	interface LiveTextContent {
		expression: OneWayAssignmentExpression;
		pipelineNames?: string[];
	}

	interface LocalTemplateVariables {
		variables: Array<{ expression: OneWayAssignmentExpression; pipelineNames?: string[]; }>;
	}

	interface DomStructuralDirectiveNodeUpgrade extends DomStructuralDirectiveNode {
		/**
		 * create a new scope for a template and bind the new variables to the directive scope.
		 * 
		 * execution for let-i="index".
		 */
		templateExpressions: ExpressionNode[];
	}

	interface DomAttributeDirectiveNodeUpgrade extends DomAttributeDirectiveNode {

	}
}
