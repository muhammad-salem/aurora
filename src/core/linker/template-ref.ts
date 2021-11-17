import type { DOMNode } from '@ibyar/elements';
import { createProxyForContext, ExpressionNode, Stack } from '@ibyar/expressions';
import { buildReactiveScopeEvents } from '../view/events.js';
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
	#templateExpressions: ExpressionNode[];

	constructor(render: ComponentRender<any>, node: DOMNode, stack: Stack, templateExpressions: ExpressionNode[]) {
		super();
		this.#render = render;
		this.#node = node;
		this.#stack = stack;
		this.#templateExpressions = templateExpressions;
	}
	get astNode(): DOMNode {
		return this.#node;
	}
	createEmbeddedView<C extends object>(context: C, parentNode: Node): EmbeddedViewRef<C> {
		const directiveStack = this.#stack.copyStack();
		const scope = directiveStack.pushBlockReactiveScopeFor(context ?? {});
		this.bindTemplateExpressions(directiveStack);
		const fragment = document.createDocumentFragment();
		this.#render.appendChildToParent(fragment, this.#node, directiveStack, parentNode);
		const elements: Node[] = [];
		fragment.childNodes.forEach(item => elements.push(item));
		const contextProxy = createProxyForContext(scope);
		return new EmbeddedViewRefImpl(contextProxy, elements);
	}
	private bindTemplateExpressions(directiveStack: Stack) {
		if (!this.#templateExpressions?.length) {
			return;
		}
		directiveStack.pushBlockReactiveScope();
		const templateStack = directiveStack.copyStack();
		// init value
		this.#templateExpressions.forEach(expression => {
			expression.get(templateStack);
		});
		// subscribe to changes
		this.#templateExpressions.forEach(expression => {
			const events = expression.events();
			const scopeMap = buildReactiveScopeEvents(events, directiveStack);
			scopeMap.forEach((scope, eventName) => {
				scope.subscribe((propertyName) => {
					if (propertyName == eventName) {
						expression.get(templateStack);
					}
				});
			});
		});
	}
}
