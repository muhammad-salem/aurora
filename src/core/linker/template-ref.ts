import type { DOMNode } from '@ibyar/elements';
import { createProxyForContext, ExpressionNode, ScopeSubscription, Stack } from '@ibyar/expressions';
import { findReactiveScopeByEventMap } from '@ibyar/expressions';
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


	constructor(
		private render: ComponentRender<any>,
		private node: DOMNode,
		private stack: Stack,
		private templateExpressions: ExpressionNode[]
	) {
		super();
	}
	get astNode(): DOMNode {
		return this.node;
	}
	createEmbeddedView<C extends object>(context: C, parentNode: Node): EmbeddedViewRef<C> {
		const directiveStack = this.stack.copyStack();

		const templateScope = directiveStack.pushBlockReactiveScope();

		const sandBox = new Stack();
		const contextScope = sandBox.pushBlockReactiveScopeFor(context ?? {});
		sandBox.pushScope(templateScope);

		const elements: Node[] = [];
		const contextProxy = createProxyForContext(contextScope);
		const embeddedViewRef = new EmbeddedViewRefImpl(contextProxy, elements);
		const scopeSubscriptions = this.executeTemplateExpressions(sandBox);
		if (scopeSubscriptions) {
			const subscription = embeddedViewRef.onDestroy(() => {
				subscription.unsubscribe();
				scopeSubscriptions.forEach(sub => sub.unsubscribe());
			});
		}

		const fragment = document.createDocumentFragment();
		this.render.appendChildToParent(fragment, this.node, directiveStack, parentNode);

		fragment.childNodes.forEach(item => elements.push(item));
		return embeddedViewRef;
	}
	private executeTemplateExpressions(sandBox: Stack): ScopeSubscription<object>[] | undefined {
		if (!this.templateExpressions?.length) {
			return;
		}
		// init value
		this.templateExpressions.forEach(expression => {
			expression.get(sandBox);
		});

		// subscribe to changes
		const scopeSubscriptions: ScopeSubscription<object>[] = [];
		this.templateExpressions.forEach(expression => {
			const events = expression.events();
			const scopeMap = findReactiveScopeByEventMap(events, sandBox);
			scopeMap.forEach((scope, eventName) => {
				const subscription = scope.subscribe((propertyName) => {
					if (propertyName == eventName) {
						expression.get(sandBox);
					}
				});
				scopeSubscriptions.push(subscription);
			});
		});
		return scopeSubscriptions;
	}
}
