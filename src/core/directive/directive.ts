import { DOMDirectiveNode } from '@ibyar/elements';
import { ComponentRender } from '../view/render.js';

import type { ExpressionNode, StackProvider } from '@ibyar/expressions';

/**
 * A structural directive selector as '*if'
 */
export class StructuralDirective<T> {
	constructor(
		protected render: ComponentRender<T>,
		protected comment: Comment,
		protected directive: DOMDirectiveNode<ExpressionNode>,
		protected directiveStack: StackProvider
	) { }
}

/**
 * An attributes directive selector as '[class] [style]'
 */
export class AttributeDirective {
	constructor(protected el: HTMLElement) { }
}
