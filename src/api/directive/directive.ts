import { DirectiveNode } from '@ibyar/jsx';
import { ContextDescriptorRef, ContextStack } from '../context/context-provider.js';
import { ComponentRender } from '../view/render.js';

/**
 * A structural directive selector as '*if'
 */
export class StructuralDirective<T> {
    constructor(
        protected render: ComponentRender<T>,
        protected comment: Comment,
        protected directive: DirectiveNode,
        protected parentContextStack: ContextStack<ContextDescriptorRef>
    ) { }
}

/**
 * An attributes directive selector as '[class] [style]'
 */
export class AttributeDirective<T> {
    constructor(protected render: ComponentRender<T>, ...values: any[]) { }
}
