import { DOMDirectiveNode } from '@ibyar/elements';
import { ComponentRender } from '../view/render.js';

import type { ExpressionNode, ScopedStack } from '@ibyar/expressions';
/**
 * A structural directive selector as '*if'
 */
export class StructuralDirective<T> {
	constructor(
		protected render: ComponentRender<T>,
		protected comment: Comment,
		protected directive: DOMDirectiveNode<ExpressionNode>,
		protected directiveStack: ScopedStack
	) { }
}

/**
 * An attributes directive selector as '[class] [style]'
 */
export class AttributeDirective<T> {
	constructor(protected render: ComponentRender<T>, ...values: any[]) { }
}
