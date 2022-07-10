import {
	ReactiveScope, ScopeContext, ScopeSubscription, Stack
} from '@ibyar/expressions';
import {
	CommentNode, DomStructuralDirectiveNode, DomStructuralDirectiveNodeUpgrade,
	DomElementNode, DomFragmentNode, DomNode, isLiveTextContent,
	isTagNameNative, isValidCustomElementName, LiveTextContent,
	TextContent, DomAttributeDirectiveNode
} from '@ibyar/elements';
import { ComponentRef } from '../component/component.js';
import { HTMLComponent, isHTMLComponent } from '../component/custom-element.js';
import { documentStack } from '../context/stack.js';
import { ClassRegistryProvider } from '../providers/provider.js';
import { isOnDestroy, isOnInit } from '../component/lifecycle.js';
import { hasAttr } from '../utils/elements-util.js';
import { AttributeDirective, AttributeOnStructuralDirective, StructuralDirective } from '../directive/directive.js';
import { TemplateRef, TemplateRefImpl } from '../linker/template-ref.js';
import { ViewContainerRefImpl } from '../linker/view-container-ref.js';
import { createSubscriptionDestroyer } from '../context/subscription.js';
import { HostListenerHandler } from '../render/host-listener.handler.js';

type ViewScopeContext = { [element: string]: HTMLElement };

function getInputEventName(element: HTMLElement): 'input' | 'change' | undefined {
	switch (true) {
		case element instanceof HTMLInputElement:
			return 'input';
		case element instanceof HTMLTextAreaElement:
		case element instanceof HTMLSelectElement:
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
	private viewScope: ReactiveScope<ViewScopeContext> = new ReactiveScope({});

	constructor(public view: HTMLComponent<T>, private subscriptions: ScopeSubscription<ScopeContext>[]) {
		this.componentRef = this.view.getComponentRef();
		this.contextStack = documentStack.copyStack();
		this.contextStack.pushScope<ScopeContext>(this.view._modelScope);
		this.templateNameScope = this.contextStack.pushReactiveScope();
	}
	initView(): void {
		if (this.componentRef.template) {
			if (typeof this.componentRef.template === 'function') {
				this.template = this.componentRef.template(this.view._model);
			} else {
				this.template = this.componentRef.template;
			}

			let rootRef: HTMLElement | ShadowRoot;
			if (this.componentRef.isShadowDom) {
				if (this.view.shadowRoot /* OPEN MODE */) {
					rootRef = this.view.shadowRoot;
				} else /* CLOSED MODE*/ {
					rootRef = Reflect.get(this.view, '_shadowRoot') as ShadowRoot;
					Reflect.deleteProperty(this.view, '_shadowRoot');
				}
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
		if (domNode instanceof DomElementNode || domNode instanceof DomFragmentNode) {
			if (domNode.children) {
				for (let index = 0; index < domNode.children.length; index++) {
					const child = domNode.children[index];
					if (this.isTemplateRefName(child)) {
						this.templateNameScope.set(child.templateRefName!.name, undefined);
					} else {
						this.initTemplateRefMap(child);
					}
				}
			}
		}
	}
	initHostListener(): void {
		const handlers = this.componentRef.hostListeners.map(listenerRef => new HostListenerHandler(listenerRef, this.view, this.viewScope));
		handlers.forEach(handler => handler.onInit());
		handlers.forEach(handler => this.subscriptions.push(createSubscriptionDestroyer(
			() => handler.onDestroy(),
			() => handler.onDisconnect(),
			() => handler.onConnect(),
		)));
	}
	addNativeEventListener(source: HTMLElement | Window, eventName: string, funcCallback: Function) {
		source.addEventListener(eventName, (event: Event) => {
			this.view._auroraZone.run(funcCallback as () => void, this.view._model);
		});
	}
	getElementByName(name: string) {
		return Reflect.get(this.view, name);
	}
	createStructuralDirective(directive: DomStructuralDirectiveNode, comment: Comment, directiveStack: Stack, subscriptions: ScopeSubscription<ScopeContext>[], parentNode: Node, host: HTMLComponent<any> | StructuralDirective): void {
		const directiveRef = ClassRegistryProvider.getDirectiveRef<T>(directive.name);
		if (directiveRef) {
			const stack = directiveStack.copyStack();
			const templateRef = new TemplateRefImpl(
				this,
				directive.node,
				stack,
				(directive as DomStructuralDirectiveNodeUpgrade).templateExpressions ?? [],
			);
			const viewContainerRef = new ViewContainerRefImpl(parentNode as Element, comment);

			// structural directive selector
			const StructuralDirectiveClass = directiveRef.modelClass as typeof StructuralDirective;
			const structural = new StructuralDirectiveClass(
				templateRef,
				viewContainerRef,
				host
			);
			templateRef.host = structural;
			stack.pushReactiveScopeFor({ 'this': structural });
			const dSubs = this.initStructuralDirective(structural, directive, stack);
			subscriptions.push(...dSubs);
			if (isOnInit(structural)) {
				structural.onInit();
			}
			if (directive.attributeDirectives?.length) {
				this.initAttributeDirectives(directive.attributeDirectives, structural, stack, subscriptions);
			}
			if (isOnDestroy(structural)) {
				subscriptions.push(createSubscriptionDestroyer(() => structural.onDestroy()));
			}
		} else {
			// didn't find directive or it is not define yet.
			// class registry should have 'when defined' callback
		}
	}
	createComment(node: CommentNode): Comment {
		return document.createComment(`${node.comment}`);
	}
	createText(node: TextContent): Text {
		return new Text(node.value);
	}
	createLiveText(textNode: LiveTextContent, contextStack: Stack, parentNode: Node, subscriptions: ScopeSubscription<ScopeContext>[]): Text {
		const liveText = new Text('');
		contextStack = contextStack.copyStack();
		contextStack.pushBlockScopeFor({ this: liveText });
		const textSubscriptions = textNode.expression.subscribe(contextStack, textNode.pipelineNames);
		subscriptions.push(...textSubscriptions);
		textNode.expression.get(contextStack);
		return liveText;
	}
	createDocumentFragment(node: DomFragmentNode, contextStack: Stack, parentNode: Node, subscriptions: ScopeSubscription<ScopeContext>[], host: HTMLComponent<any> | StructuralDirective): DocumentFragment {
		const fragment = document.createDocumentFragment();
		node.children?.forEach(child => this.appendChildToParent(fragment, child, contextStack, parentNode, subscriptions, host));
		return fragment;
	}
	appendChildToParent(fragmentParent: HTMLElement | DocumentFragment, child: DomNode, contextStack: Stack, parentNode: Node, subscriptions: ScopeSubscription<ScopeContext>[], host: HTMLComponent<any> | StructuralDirective) {
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
			fragmentParent.append(this.createElement(child, contextStack, subscriptions, parentNode, host));
		} else if (child instanceof DomStructuralDirectiveNode) {
			const commentText = child.name + (typeof child.value == 'string' ? (' = ' + child.value) : '');
			const comment = document.createComment(`start ${commentText}`);
			fragmentParent.append(comment);
			const lastComment = document.createComment(`end ${commentText}`);
			comment.after(lastComment);
			this.createStructuralDirective(child, comment, contextStack, subscriptions, parentNode, host);
		} else if (isLiveTextContent(child)) {
			fragmentParent.append(this.createLiveText(child, contextStack, parentNode, subscriptions));
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
		if (isHTMLComponent(element)) {
			element.setParentComponent(this.view);
		}
		return element;
	}
	createElement(node: DomElementNode, contextStack: Stack, subscriptions: ScopeSubscription<ScopeContext>[], parentNode: Node, host: HTMLComponent<any> | StructuralDirective): HTMLElement {
		const element = this.createElementByTagName(node);
		const elementStack = contextStack.copyStack();
		const elementScope = isHTMLComponent(element) ? element._viewScope : elementStack.pushReactiveScopeFor({ 'this': element });
		elementStack.pushScope<ScopeContext>(elementScope);
		const attributesSubscriptions = this.initAttribute(element, node, elementStack);
		subscriptions.push(...attributesSubscriptions);
		const eventName = getInputEventName(element);
		let listener: ((event: HTMLElementEventMap['input' | 'change']) => any) | undefined;
		if (eventName) {
			const inputScope = elementScope.getScopeOrCreate('this');
			listener = (event) => inputScope.emit('value', (element as HTMLInputElement).value);
			element.addEventListener(eventName, listener);
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
				this.appendChildToParent(element, child, elementStack, element, subscriptions, host);
			}
		}
		if (node.attributeDirectives?.length) {
			this.initAttributeDirectives(node.attributeDirectives, element, contextStack, subscriptions);
		}
		return element;
	}
	private initAttributeDirectives(
		attributeDirectives: DomAttributeDirectiveNode[],
		element: HTMLElement | StructuralDirective,
		contextStack: Stack, subscriptions: ScopeSubscription<ScopeContext>[]) {
		attributeDirectives?.forEach(directiveNode => {
			const directiveRef = ClassRegistryProvider.getDirectiveRef<any>(directiveNode.name);
			if (directiveRef &&
				(directiveRef.modelClass.prototype instanceof AttributeDirective
					|| directiveRef.modelClass.prototype instanceof AttributeOnStructuralDirective
				)) {
				const directive = new directiveRef.modelClass(element) as AttributeDirective | AttributeOnStructuralDirective;
				const stack = contextStack.copyStack();
				stack.pushReactiveScopeFor({ 'this': directive });
				const directiveSubscriptions = this.initStructuralDirective(directive, directiveNode, stack);
				subscriptions.push(...directiveSubscriptions);
				if (isOnInit(directive)) {
					directive.onInit();
				}
				if (isOnDestroy(directive)) {
					subscriptions.push(createSubscriptionDestroyer(() => directive.onDestroy()));
				}
			}
		});
	}

	initAttribute(element: HTMLElement, node: DomElementNode, contextStack: Stack): ScopeSubscription<ScopeContext>[] {
		const subscriptions: ScopeSubscription<ScopeContext>[] = [];
		if (node.attributes?.length) {
			node.attributes.forEach(attr => {
				/**
				 * <input id="23" name="person-name" />
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
						event.expression.get(stack);
					};
				} else /* if (typeof event.sourceHandler === 'function')*/ {
					// let eventName: keyof HTMLElementEventMap = event.eventName;
					listener = event.value;
				}
				element.addEventListener(event.name as any, listener as any);
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

	initStructuralDirective(
		directive: StructuralDirective | AttributeDirective | AttributeOnStructuralDirective,
		node: DomStructuralDirectiveNode | DomAttributeDirectiveNode,
		contextStack: Stack): ScopeSubscription<ScopeContext>[] {
		const subscriptions: ScopeSubscription<ScopeContext>[] = [];

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
					event.expression.get(stack);
				};
				((<any>directive)[event.name] as any).subscribe(listener);
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
