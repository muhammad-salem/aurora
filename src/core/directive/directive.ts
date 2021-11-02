import { DOMDirectiveNode, DOMElementNode } from '@ibyar/elements';
import { ComponentRender } from '../view/render.js';

import type { Stack } from '@ibyar/expressions';

/**
 * A structural directive selector as '*if'
 */
export class StructuralDirective {
	constructor(
		protected render: ComponentRender<any>,
		protected comment: Comment,
		protected directive: DOMDirectiveNode,
		protected directiveStack: Stack
	) { }
	protected findTemplate(templateRefName: string): DOMElementNode | undefined {
		return this.render.templateRefMap.get(templateRefName);
	}
}

/**
 * An attributes directive selector as '[class] [style]'
 */
export class AttributeDirective {
	constructor(protected el: HTMLElement) { }
}
