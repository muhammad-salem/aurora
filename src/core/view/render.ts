import { ReactiveScope, Context, ScopeSubscription, Stack, ReadOnlyScope } from '@ibyar/expressions';
import {
	CommentNode, DomStructuralDirectiveNode,
	DomElementNode, DomFragmentNode, DomNode, isLiveTextContent,
	isTagNameNative, isValidCustomElementName, LiveTextContent,
	TextContent, DomAttributeDirectiveNode, isFormAssociatedCustomElementByTag
} from '@ibyar/elements';
import type { DomStructuralDirectiveNodeUpgrade } from '@ibyar/elements/node.js';
import { ComponentRef } from '../component/component.js';
import { HTMLComponent, isHTMLComponent } from '../component/custom-element.js';
import { documentStack } from '../context/stack.js';
import { ClassRegistryProvider } from '../providers/provider.js';
import { isOnDestroy, isOnInit } from '../component/lifecycle.js';
import { hasAttr } from '../utils/elements-util.js';
import { AttributeDirective, AttributeOnStructuralDirective, StructuralDirective } from '../directive/directive.js';
import { TemplateRef, TemplateRefImpl } from '../linker/template-ref.js';
import { ViewContainerRefImpl } from '../linker/view-container-ref.js';
import { createDestroySubscription } from '../context/subscription.js';
import { EventEmitter } from '../component/events.js';

type ViewContext = { [element: string]: HTMLElement };

function getChangeEventName(tagName: string): 'input' | 'change' | undefined {
	switch (true) {
		case tagName === 'input':
			return 'input';
		case tagName === 'textarea':
		case tagName === 'select':
		case isFormAssociatedCustomElementByTag(tagName):
			return 'change';
		default:
			return undefined;
	}
}
export class ComponentRender<T extends object> {
	private componentRef: ComponentRef<T>;
	private template: DomNode;
	private contextStack: Stack;
	private templateNameScope: ReactiveScope<{ [templateName: string]: TemplateRef }>;
	private exportAsScope: ReactiveScope<Record<string, any>>;
	private viewScope: ReactiveScope<ViewContext> = new ReactiveScope({});

	constructor(public view: HTMLComponent<T>, private subscriptions: ScopeSubscription<Context>[]) {
		this.componentRef = this.view.getComponentRef();
		this.contextStack = documentStack.copyStack();
		this.contextStack.pushScope<Context>(this.view._modelScope);
		this.exportAsScope = this.contextStack.pushReactiveScope();
		this.templateNameScope = this.contextStack.pushReactiveScope();
	}
	initView(): void {
		if (!this.componentRef.template) {
			return;
		}
		if (typeof this.componentRef.template === 'function') {
			this.template = this.componentRef.template(this.view._model);
		} else {
			this.template = this.componentRef.template;
		}

		let rootRef: HTMLElement | ShadowRoot;
		if (this.componentRef.isShadowDom) {
			rootRef = Reflect.get(this.view, '_shadowRoot') as ShadowRoot;
			Reflect.deleteProperty(this.view, '_shadowRoot');
		} else {
			rootRef = this.view;
		}
		this.initTemplateRefMap(this.template);
		let rootFragment: DocumentFragment;
		if (this.template instanceof DomFragmentNode) {
			rootFragment = this.createDocumentFragment(this.template, this.contextStack, rootRef, this.subscriptions, this.view);
		} else {
			rootFragment = document.createDocumentFragment();
			this.appendChildToParent(rootFragment, this.template, this.contextStack, rootRef, this.subscriptions, this.view);
		}
		rootRef.append(rootFragment);
	}
	isTemplateRefName(template: DomNode): template is DomElementNode {
		if (template instanceof DomElementNode) {
			if (template.tagName === 'template' && template.templateRefName) {
				return true;
			}
		}
		return false;
	}
	initTemplateRefMap(domNode: DomNode) {
		if (!(domNode instanceof DomElementNode || domNode instanceof DomFragmentNode) || !domNode.children) {
			return;
		}
		for (let index = 0; index < domNode.children.length; index++) {
			const child = domNode.children[index];
			if (this.isTemplateRefName(child)) {
				this.templateNameScope.set(child.templateRefName!.name, undefined);
			} else {
				this.initTemplateRefMap(child);
			}
		}
	}
	initViewBinding() {
		if (this.componentRef.viewBindings) {
			this.initHtmlElement(this.view, this.componentRef.viewBindings, this.contextStack, this.subscriptions);
		}
		if (this.componentRef.windowBindings) {
			this.subscriptions.push(...this.initAttribute(window as any, this.componentRef.windowBindings, this.contextStack));
		}
	}
	getElementByName(name: string) {
		return Reflect.get(this.view, name);
	}
	createStructuralDirective(directive: DomStructuralDirectiveNode, comment: Comment, directiveStack: Stack, subscriptions: ScopeSubscription<Context>[], parentNode: Node, host: HTMLComponent<any> | StructuralDirective): void {
		const directiveRef = ClassRegistryProvider.getDirectiveRef<T>(directive.name);
		if (!directiveRef) {
			// didn't find directive or it is not define yet.
			// class registry should have 'when defined' callback
			return;
		}
		const stack = directiveStack.copyStack();
		const templateRef = new TemplateRefImpl(
			this,
			directive.node,
			stack,
			(directive as DomStructuralDirectiveNodeUpgrade).templateExpressions ?? [],
		);
		const directiveZone = this.view._zone.fork(directiveRef.zone);
		const viewContainerRef = new ViewContainerRefImpl(parentNode as Element, comment);

		directiveZone.onEmpty.subscribe(() => {
			const length = viewContainerRef.length;
			for (let index = 0; index < length; index++) {
				viewContainerRef.get(index)?.detectChanges();
			}
		});

		const StructuralDirectiveClass = directiveRef.modelClass as typeof StructuralDirective;
		const structural = directiveZone.run(() => new StructuralDirectiveClass(
			templateRef,
			viewContainerRef,
			host,
			directiveZone,
		));
		templateRef.host = structural;
		const scope = ReactiveScope.readOnlyScopeForThis(structural);
		scope.getInnerScope('this')!.getContextProxy = () => structural;
		stack.pushScope(scope);
		if (directiveRef.exportAs) {
			stack.pushBlockScopeFor({ [directiveRef.exportAs]: structural });
		}
		subscriptions.push(...this.initDirective(structural, directive, stack));
		if (isOnInit(structural)) {
			directiveZone.run(structural.onInit, structural);
		}
		if (directive.attributeDirectives?.length) {
			this.initAttributeDirectives(directive.attributeDirectives, structural, stack, subscriptions);
		}
		if (isOnDestroy(structural)) {
			subscriptions.push(createDestroySubscription(() => structural.onDestroy()));
		}

	}
	createComment(node: CommentNode): Comment {
		return document.createComment(`${node.comment}`);
	}
	createText(node: TextContent): Text {
		return new Text(node.value);
	}
	createLiveText(textNode: LiveTextContent, contextStack: Stack, subscriptions: ScopeSubscription<Context>[]): Text {
		const liveText = new Text('');
		contextStack = contextStack.copyStack();
		contextStack.pushBlockScopeFor({ this: liveText });
		const textSubscriptions = textNode.expression.subscribe(contextStack, textNode.pipelineNames);
		subscriptions.push(...textSubscriptions);
		textNode.expression.get(contextStack);
		return liveText;
	}
	createDocumentFragment(node: DomFragmentNode, contextStack: Stack, parentNode: Node, subscriptions: ScopeSubscription<Context>[], host: HTMLComponent<any> | StructuralDirective): DocumentFragment {
		const fragment = document.createDocumentFragment();
		node.children?.forEach(child => this.appendChildToParent(fragment, child, contextStack, parentNode, subscriptions, host));
		return fragment;
	}
	appendChildToParent(fragmentParent: HTMLElement | DocumentFragment, child: DomNode, contextStack: Stack, parentNode: Node, subscriptions: ScopeSubscription<Context>[], host: HTMLComponent<any> | StructuralDirective) {
		if (child instanceof DomElementNode) {
			if (this.isTemplateRefName(child)) {
				const templateRefName = child.templateRefName!;
				// const oldRef = this.templateNameScope.get(templateRefName.name);
				// if (oldRef) {
				// 	return;
				// }
				// TODO: extract template expression
				const templateRef = new TemplateRefImpl(
					this,
					new DomFragmentNode(child.children),
					contextStack.copyStack(),
					[]
				);
				this.templateNameScope.set(templateRefName.name, templateRef);
				return;
			}
			fragmentParent.append(this.createElement(child, contextStack, subscriptions, host));
		} else if (child instanceof DomStructuralDirectiveNode) {
			const commentText = child.name + (typeof child.value == 'string' ? (' = ' + child.value) : '');
			const comment = document.createComment(`start ${commentText}`);
			fragmentParent.append(comment);
			const lastComment = document.createComment(`end ${commentText}`);
			comment.after(lastComment);
			this.createStructuralDirective(child, comment, contextStack, subscriptions, parentNode, host);
		} else if (isLiveTextContent(child)) {
			fragmentParent.append(this.createLiveText(child, contextStack, subscriptions));
		} else if (child instanceof TextContent) {
			fragmentParent.append(this.createText(child));
		} else if (child instanceof CommentNode) {
			fragmentParent.append(this.createComment(child));
		} else if (child instanceof DomFragmentNode) {
			fragmentParent.append(this.createDocumentFragment(child, contextStack, parentNode, subscriptions, host));
		}
	}
	createElementByTagName(node: { tagName: string, is?: string }): HTMLElement {
		let element: HTMLElement;
		if (isValidCustomElementName(node.tagName)) {
			const ViewClass = customElements.get(node.tagName) as ((new () => HTMLElement) | undefined);
			if (ViewClass) {
				element = new ViewClass();
			} else {
				element = document.createElement(node.tagName);
				if (element.constructor.name === 'HTMLElement') {
					customElements.whenDefined(node.tagName).then(() => customElements.upgrade(element));
				}
			}
		} else if (isTagNameNative(node.tagName)) {
			// native tags // and custom tags can be used her
			element = document.createElement(node.tagName, node.is ? { is: node.is } : undefined);
		} else {
			// html unknown element
			element = document.createElement(node.tagName);
		}
		return element;
	}
	createElement(node: DomElementNode, contextStack: Stack, subscriptions: ScopeSubscription<Context>[], host: HTMLComponent<any> | StructuralDirective): HTMLElement {
		const element = this.createElementByTagName(node);
		this.initHtmlElement(element, node, contextStack, subscriptions, host);
		return element;
	}

	private createReadOnlyWithReactiveInnerScope<T extends Context>(ctx: T, aliasName?: string, propertyKeys?: (keyof T)[]) {
		if (!aliasName) {
			return ReactiveScope.readOnlyScopeForThis(ctx, propertyKeys);
		}
		const reactiveScope = ReactiveScope.for(ctx, propertyKeys);
		const context: Record<string, any> = {
			'this': ctx,
			[aliasName]: ctx,
		};
		const rootScope = ReadOnlyScope.for(context, ['this', aliasName]);
		rootScope.setInnerScope('this', reactiveScope);
		rootScope.setInnerScope(aliasName as 'this', reactiveScope);
		return rootScope;
	}

	/**
	 * use for init host bindings
	 * @param element 
	 * @param node 
	 * @param contextStack 
	 * @param subscriptions 
	 */
	initHtmlElement(element: HTMLElement, node: DomElementNode, contextStack: Stack, subscriptions: ScopeSubscription<Context>[]): void;

	/**
	 * use to init a new create html element
	 * @param element 
	 * @param node 
	 * @param contextStack 
	 * @param subscriptions 
	 * @param host is the direct html element `this.view` or a sub `structural directive` like `*if` or `*for`, etc...
	 */
	initHtmlElement(element: HTMLElement, node: DomElementNode, contextStack: Stack, subscriptions: ScopeSubscription<Context>[], host: HTMLComponent<any> | StructuralDirective): void;
	initHtmlElement(element: HTMLElement, node: DomElementNode, contextStack: Stack, subscriptions: ScopeSubscription<Context>[], host?: HTMLComponent<any> | StructuralDirective): void {
		const elementStack = contextStack.copyStack();
		const elementScope = isHTMLComponent(element)
			? element._viewScope
			: this.createReadOnlyWithReactiveInnerScope(element, node.templateRefName?.name);
		elementStack.pushScope<Context>(elementScope);
		const attributesSubscriptions = this.initAttribute(element, node, elementStack);
		subscriptions.push(...attributesSubscriptions);
		const changeEventName = getChangeEventName(node.tagName);
		if (changeEventName) {
			const inputScope = elementScope.getInnerScope<ReactiveScope<HTMLInputElement>>('this')!;
			const listener = (event: HTMLElementEventMap['input' | 'change']) => inputScope.emit('value', (element as HTMLInputElement).value);
			element.addEventListener(changeEventName, listener);
			subscriptions.push(createDestroySubscription(
				() => element.removeEventListener(changeEventName, listener),
			));
		}

		const templateRefName = node.templateRefName;
		if (templateRefName) {
			Reflect.set(this.view, templateRefName.name, element);
			this.viewScope.set(templateRefName.name, element);
			const view = this.componentRef.viewChild.find(child => child.selector === templateRefName.name);
			if (view) {
				Reflect.set(this.view._model, view.modelName, element);
			}
		}
		if (node.children) {
			for (const child of node.children) {
				this.appendChildToParent(element, child, elementStack, element, subscriptions, host!);
			}
		}
		if (node.attributeDirectives?.length) {
			this.initAttributeDirectives(node.attributeDirectives, element, contextStack, subscriptions);
		}
	}
	private initAttributeDirectives(
		attributeDirectives: DomAttributeDirectiveNode[],
		element: HTMLElement | StructuralDirective,
		contextStack: Stack,
		subscriptions: ScopeSubscription<Context>[]) {
		attributeDirectives?.forEach(directiveNode => {
			const directiveRef = ClassRegistryProvider.getDirectiveRef<any>(directiveNode.name);
			if (!directiveRef
				|| !((directiveRef.modelClass.prototype instanceof AttributeDirective)
					|| (directiveRef.modelClass.prototype instanceof AttributeOnStructuralDirective))) {
				return;
			}
			const directiveZone = this.view._zone.fork(directiveRef.zone);
			const directive = directiveZone.run(() => new directiveRef.modelClass(element, directiveZone) as AttributeDirective | AttributeOnStructuralDirective);
			if (directiveRef.exportAs) {
				this.exportAsScope.set(directiveRef.exportAs, directive);
			}

			const stack = contextStack.copyStack();
			const scope = ReactiveScope.readOnlyScopeForThis(directive);
			const directiveScope = scope.getInnerScope('this')!;
			directiveScope.getContextProxy = () => directive;
			stack.pushScope(scope);

			const directiveSubscriptions = this.initDirective(directive, directiveNode, stack);
			subscriptions.push(...directiveSubscriptions);
			if (isOnInit(directive)) {
				directiveZone.run(directive.onInit, directive);
			}
			if (isOnDestroy(directive)) {
				subscriptions.push(createDestroySubscription(() => directive.onDestroy()));
			}
			if (!(element instanceof HTMLElement)) {
				return;
			}
			const attributeName = directiveRef.selector.replace(/[A-Z]/g, m => '-' + m.toLowerCase());
			if (!element.hasAttribute(attributeName)) {
				element.setAttribute(attributeName, '');
			}
			if (directiveRef.viewBindings) {
				const directiveStack = stack.copyStack();
				directiveStack.pushScope(directiveScope);
				this.initHtmlElement(element, directiveRef.viewBindings, directiveStack, subscriptions);
			}
		});
	}

	initAttribute(element: HTMLElement, node: DomElementNode, contextStack: Stack): ScopeSubscription<Context>[] {
		const subscriptions: ScopeSubscription<Context>[] = [];
		if (node.attributes?.length) {
			node.attributes.forEach(attr => {
				/**
				 * <input id="23" name="person-name" data-id="1234567890" data-user="carinaanand" data-date-of-birth />
				 */
				const isAttr = hasAttr(element, attr.name);
				if (isAttr) {
					if (attr.value === false) {
						element.removeAttribute(attr.name);
					} else if (attr.value === true) {
						element.setAttribute(attr.name, '');
					} else {
						element.setAttribute(attr.name, attr.value as string);
					}
				} else {
					Reflect.set(element, attr.name, attr.value);
				}
			});
		}
		if (node.twoWayBinding?.length) {
			node.twoWayBinding.forEach(attr => {
				const sub = attr.expression.subscribe(contextStack);
				subscriptions.push(...sub);
				attr.expression.get(contextStack);
			});
		}
		if (node.inputs?.length) {
			node.inputs.forEach(attr => {
				const sub = attr.expression.subscribe(contextStack, attr.pipelineNames);
				subscriptions.push(...sub);
				attr.expression.get(contextStack);
			});
		}
		if (node.outputs?.length) {
			node.outputs.forEach(event => {
				let listener: Function;
				/**
				 * <a (click)="onLinkClick($event)"></a>
				 * <a @click="onLinkClick($event)"></a>
				 * <input [(value)]="person.name" />
				 * <input (value)="person.name" />
				 * <!-- <input (value)="person.name = $event" /> -->
				 * 
				 * TODO: diff of event listener and back-way data binding
				 */
				if (typeof event.value === 'string') {
					listener = ($event: Event) => {
						const stack = contextStack.copyStack();
						stack.pushBlockScopeFor({ $event });
						this.view._zone.run(event.expression.get, event.expression, [stack]);
					};
				} else /* if (typeof event.sourceHandler === 'function')*/ {
					// let eventName: keyof HTMLElementEventMap = event.eventName;
					listener = event.value;
				}
				element.addEventListener(event.name as any, listener as any);
				subscriptions.push(createDestroySubscription(
					() => element.removeEventListener(event.name as any, listener as any),
				));
			});
		}
		if (node.templateAttrs?.length) {
			node.templateAttrs.forEach(attr => {
				const sub = attr.expression.subscribe(contextStack);
				subscriptions.push(...sub);
				attr.expression.get(contextStack);
			});
		}
		return subscriptions;
	}
	initDirective(
		directive: StructuralDirective | AttributeDirective | AttributeOnStructuralDirective,
		node: DomStructuralDirectiveNode | DomAttributeDirectiveNode,
		contextStack: Stack): ScopeSubscription<Context>[] {
		const subscriptions: ScopeSubscription<Context>[] = [];

		if (node.attributes?.length) {
			node.attributes.forEach(attr => Reflect.set(directive, attr.name, attr.value));
		}
		if (node.twoWayBinding?.length) {
			node.twoWayBinding.forEach(attr => {
				const sub = attr.expression.subscribe(contextStack);
				subscriptions.push(...sub);
				attr.expression.get(contextStack);
			});
		}
		if (node.inputs?.length) {
			node.inputs.forEach(attr => {
				const sub = attr.expression.subscribe(contextStack, attr.pipelineNames);
				subscriptions.push(...sub);
				attr.expression.get(contextStack);
			});
		}
		if (node.outputs?.length) {
			node.outputs.forEach(event => {
				const listener = ($event: Event) => {
					const stack = contextStack.copyStack();
					stack.pushBlockScopeFor({ $event });
					this.view._zone.run(event.expression.get, event.expression, [stack]);
				};
				const subscription = ((directive as any)[event.name] as EventEmitter<T>).subscribe(listener);
				subscriptions.push(createDestroySubscription(
					() => ((directive as any)[event.name] as EventEmitter<T>).remove(subscription),
				));
			});
		}
		if (node.templateAttrs?.length) {
			node.templateAttrs.forEach(attr => {
				const sub = attr.expression.subscribe(contextStack);
				subscriptions.push(...sub);
				attr.expression.get(contextStack);
			});
		}
		// TODO: 
		// check host binding
		return subscriptions;
	}

}
