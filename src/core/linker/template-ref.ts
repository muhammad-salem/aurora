import { DomNode } from '@ibyar/elements';
import {
	ExpressionNode, findReactiveScopeByEventMap,
	ReactiveScopeControl, Context,
	ScopeSubscription, Stack
} from '@ibyar/expressions';
import { HTMLComponent } from '../component/custom-element.js';
import { StructuralDirective } from '../directive/directive.js';
import { ComponentRender } from '../view/render.js';
import { EmbeddedViewRef, EmbeddedViewRefImpl } from './view-ref.js';

export abstract class TemplateRef {

	/**
	 * get the current ref of this template
	 */
	abstract get astNode(): DomNode;

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
	private _host: HTMLComponent<any> | StructuralDirective;

	constructor(
		private render: ComponentRender<any>,
		private node: DomNode,
		private stack: Stack,
		private templateExpressions: ExpressionNode[],
	) {
		super();
	}
	get astNode(): DomNode {
		return this.node;
	}
	set host(host: HTMLComponent<any> | StructuralDirective) {
		this._host = host;
	}
	createEmbeddedView<C extends object>(context: C = {} as C, parentNode: Node): EmbeddedViewRef<C> {
		const directiveStack = this.stack.copyStack();
		const templateScope = ReactiveScopeControl.blockScope<C>();
		directiveStack.pushScope(templateScope);

		const sandBox = new Stack();
		const contextScope = ReactiveScopeControl.for<C>(context);
		sandBox.pushScope(contextScope);
		sandBox.pushScope(templateScope);

		const elements: Node[] = [];
		const subscriptions: ScopeSubscription<Context>[] = [];
		const embeddedViewRef = new EmbeddedViewRefImpl(contextScope, elements, subscriptions);
		const scopeSubscriptions = this.executeTemplateExpressions(sandBox);
		scopeSubscriptions && subscriptions.push(...scopeSubscriptions);

		const fragment = document.createDocumentFragment();
		this.render.appendChildToParent(fragment, this.node, directiveStack, parentNode, subscriptions, this._host);

		fragment.childNodes.forEach(item => elements.push(item));
		// const updateSubscriptions = this.render.view._zone.onFinal.subscribe(() => contextScope.detectChanges());
		// embeddedViewRef.onDestroy(() => updateSubscriptions.unsubscribe());
		return embeddedViewRef;
	}
	private executeTemplateExpressions(sandBox: Stack): ScopeSubscription<Context>[] | undefined {
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
			const scopeTuples = findReactiveScopeByEventMap(events, sandBox);
			scopeTuples.forEach(tuple => {
				const subscription = tuple[1].subscribe(tuple[0], () => {
					expression.get(sandBox);
				});
				scopeSubscriptions.push(subscription);
			});
		});
		return scopeSubscriptions;
	}
}
