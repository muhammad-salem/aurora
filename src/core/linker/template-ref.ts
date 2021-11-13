import type { DOMNode } from '@ibyar/elements';
import type { Stack } from '@ibyar/expressions';
import { ElementModelReactiveScope } from '../component/provider.js';
import { ComponentRender } from '../view/render.js';
import { EmbeddedViewRef, EmbeddedViewRefImpl } from './view-ref.js';

export abstract class TemplateRef {

	/**
	 * get the current ref of this template
	 */
	abstract get astNode(): DOMNode;

	/**
	 * Instantiates an embedded view based on this template,
	 * `Not attached to the view`.
	 * @param context The data-binding context of the embedded view, as declared
	 * in the `<template>` usage.
	 * 
	 * To insert it to a view need to use a `ViewContainerRef.createEmbeddedView()`
	 * @returns The new embedded view object.
	 */
	abstract createEmbeddedView<C extends object>(context: C, parentNode: Node): EmbeddedViewRef<C>;
}


export class TemplateRefImpl extends TemplateRef {
	#render: ComponentRender<any>;
	#stack: Stack;
	#node: DOMNode;

	constructor(render: ComponentRender<any>, node: DOMNode, stack: Stack) {
		super();
		this.#render = render;
		this.#node = node;
		this.#stack = stack;
	}
	get astNode(): DOMNode {
		return this.#node;
	}
	createEmbeddedView<C extends object>(context: C, parentNode: Node): EmbeddedViewRef<C> {
		const stack = this.#stack.copyStack();
		const scope = ElementModelReactiveScope.blockScopeFor(context ?? {});
		stack.pushScope(scope);
		const fragment = document.createDocumentFragment();
		this.#render.appendChildToParent(fragment, this.#node, stack, parentNode);
		const elements: Node[] = [];
		fragment.childNodes.forEach(item => elements.push(item));
		return new EmbeddedViewRefImpl(scope, elements);
	}
}
