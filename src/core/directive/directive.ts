import { DOMElementNode, DOMNode } from '@ibyar/elements';
import { ComponentRender } from '../view/render.js';

import type { Stack } from '@ibyar/expressions';

/**
 * A structural directive selector as '*if'
 */
export class StructuralDirective {
	constructor(
		protected render: ComponentRender<any>,
		protected directiveStack: Stack,
		protected comment: Comment,
		protected parentNode: Node,
		protected node: DOMNode,
		protected directiveValue: string,
		// protected directive: DOMDirectiveNode,

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
