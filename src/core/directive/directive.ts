import { DomDirectiveNode } from '@ibyar/elements';
import { ContextDescriptorRef, ContextStack } from '../context/context-provider.js';
import { ComponentRender } from '../view/render.js';

import type { ExpressionNode } from '@ibyar/expressions/api';
/**
 * A structural directive selector as '*if'
 */
export class StructuralDirective<T> {
	constructor(
		protected render: ComponentRender<T>,
		protected comment: Comment,
		protected directive: DomDirectiveNode<ExpressionNode>,
		protected parentContextStack: ContextStack<ContextDescriptorRef>
	) { }
}

/**
 * An attributes directive selector as '[class] [style]'
 */
export class AttributeDirective<T> {
	constructor(protected render: ComponentRender<T>, ...values: any[]) { }
}
