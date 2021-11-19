import { ExpressionEventMap, ExpressionNode, ReactiveScope, Scope, ScopeContext, Stack } from '@ibyar/expressions';
import {
	CommentNode, DOMDirectiveNode,
	DOMDirectiveNodeUpgrade,
	DOMElementNode, DOMFragmentNode, DOMNode,
	isLiveTextContent,
	isTagNameNative, isValidCustomElementName,
	LiveAttribute, LiveTextContent, TextContent
} from '@ibyar/elements';
import { ComponentRef, ListenerRef } from '../component/component.js';
import { ElementMutation } from './mutation.js';
import { HTMLComponent, isHTMLComponent } from '../component/custom-element.js';
import { documentStack } from '../context/stack.js';
import { ClassRegistryProvider } from '../providers/provider.js';
import { EventEmitter } from '../component/events.js';
import { isOnDestroy, isOnInit } from '../component/lifecycle.js';
import { hasAttr } from '../utils/elements-util.js';
import {
	addChangeListener, isModel, Model,
	SourceFollowerCallback, subscribe1way, subscribe2way
} from '../model/change-detection.js';
import { AsyncPipeProvider, PipeProvider, PipeTransform } from '../pipe/pipe.js';
import { StructuralDirective } from '../directive/directive.js';
import { ElementReactiveScope } from '../directive/providers.js';
import { findScopeMap } from './events.js';
import { TemplateRef, TemplateRefImpl } from '../linker/template-ref.js';
import { ViewContainerRefImpl } from '../linker/view-container-ref.js';

function getChangeEventName(element: HTMLElement, elementAttr: string): 'input' | 'change' | string {
	if (elementAttr === 'value') {
		if (element instanceof HTMLInputElement) {
			return 'input';
		} else if (element instanceof HTMLSelectElement
			|| element instanceof HTMLTextAreaElement) {
			return 'change';
		}
	}
	return elementAttr;
}
export class ComponentRender<T extends object> {
	componentRef: ComponentRef<T>;
	template: DOMNode;
	nativeElementMutation: ElementMutation;
	contextStack: Stack;
	templateNameScope: ReactiveScope<{ [templateName: string]: TemplateRef }>;

	constructor(public view: HTMLComponent<T>) {
		this.componentRef = this.view.getComponentRef();
		this.contextStack = documentStack.copyStack();
		this.contextStack.pushFunctionScope(); // to protect documentStack
		this.contextStack.pushScope(this.view._viewScope);
		this.contextStack.pushScope<ScopeContext>(this.view._modelScope);
		this.templateNameScope = this.contextStack.pushBlockReactiveScope();
		this.nativeElementMutation = new ElementMutation();
		this.view._model.subscribeModel('destroy', () => {
			this.nativeElementMutation.disconnect();
		});
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
			const rootFragment = document.createDocumentFragment();
			this.appendChildToParent(rootFragment, this.template, this.contextStack, rootRef);
			rootRef.append(rootFragment);
		}
	}
	isTemplateRefName(template: DOMNode): template is DOMElementNode {
		if (template instanceof DOMElementNode) {
			if (template.tagName === 'template' && template.templateRefName) {
				return true;
			}
		}
		return false;
	}
	initTemplateRefMap(domNode: DOMNode) {
		if (domNode instanceof DOMElementNode || domNode instanceof DOMFragmentNode) {
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
		this.componentRef.hostListeners?.forEach(
			listener => this.handelHostListener(listener)
		);
	}
	handelHostListener(listener: ListenerRef) {
		let eventName: string = listener.eventName, source: HTMLElement | Window;
		if (listener.eventName.includes(':')) {
			const eventSource = eventName.substring(0, eventName.indexOf(':'));
			eventName = eventName.substring(eventName.indexOf(':') + 1);
			if ('window' === eventSource.toLowerCase()) {
				source = window;
				this.addNativeEventListener(source, eventName, (event: any) => {
					(this.view._model[listener.modelCallbackName] as Function).call(this.view._proxyModel, event);
				});
				return;
			} else if (eventSource in this.view) {
				source = Reflect.get(this.view, eventSource);
				if (!Reflect.has(source, '_model')) {
					this.addNativeEventListener(source, eventName, (event: any) => {
						(this.view._model[listener.modelCallbackName] as Function).call(this.view._proxyModel, event);
					});
					return;
				}
			} else {
				source = this.view;
			}
		} else {
			source = this.view;
		}
		const sourceModel = Reflect.get(source, '_model') as Model & { [key: string]: EventEmitter<any> };
		const output = ClassRegistryProvider.hasOutput(sourceModel, eventName);
		if (output) {
			sourceModel[output.modelProperty].subscribe((value: any) => {
				(this.view._model[listener.modelCallbackName] as Function).call(this.view._proxyModel, value);
			});
		}
		else if (Reflect.has(source, 'on' + eventName)) {
			this.addNativeEventListener(source, eventName, (event: any) => {
				(this.view._model[listener.modelCallbackName] as Function).call(this.view._proxyModel, event);
			});
		}
		// else if (this.componentRef.encapsulation === 'template' && !this.view.hasParentComponent()) {
		// 	this.addNativeEventListener(this.view, eventName, eventCallback);
		// }
		else {
			// listen to internal changes
			// TODO: need to resolve parameter
			addChangeListener(sourceModel, eventName, () => (this.view._model[listener.modelCallbackName] as Function).call(this.view._proxyModel));
		}
	}
	addNativeEventListener(source: HTMLElement | Window, eventName: string, funcCallback: Function) {
		source.addEventListener(eventName, (event: Event) => {
			funcCallback.call(this.view._proxyModel, event);
		});
	}
	getElementByName(name: string) {
		return Reflect.get(this.view, name);
	}
	createStructuralDirective(directive: DOMDirectiveNode, comment: Comment, directiveStack: Stack, parentNode: Node): void {
		const directiveRef = ClassRegistryProvider.getDirectiveRef<T>(directive.name);
		if (directiveRef) {
			// structural directive selector
			const StructuralDirectiveClass = directiveRef.modelClass as typeof StructuralDirective;
			const stack = directiveStack.copyStack();
			const templateRef = new TemplateRefImpl(
				this,
				directive.node,
				stack,
				(directive as DOMDirectiveNodeUpgrade).templateExpressions ?? []
			);
			const viewContainerRef = new ViewContainerRefImpl(parentNode as Element, comment);

			const structural = new StructuralDirectiveClass(
				templateRef,
				viewContainerRef,
			);
			stack.pushBlockReactiveScopeFor({ 'this': structural });
			if (isOnDestroy(structural)) {
				const removeSubscription = this.nativeElementMutation.subscribeOnRemoveNode(parentNode, comment, () => {
					removeSubscription.unsubscribe();
					structural.onDestroy();
				});
			}
			this.initDirectiveAttributes(structural, directive, stack);
			if (isOnInit(structural)) {
				structural.onInit();
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
	createLiveText(textNode: LiveTextContent, contextStack: Stack, parentNode: Node): Text {
		const liveText = new Text('');
		contextStack = contextStack.copyStack();
		contextStack.pushBlockScopeFor({ this: liveText });
		this.bind1Way(liveText, textNode, contextStack);
		return liveText;
	}
	createDocumentFragment(node: DOMFragmentNode, contextStack: Stack, parentNode: Node): DocumentFragment {
		const fragment = document.createDocumentFragment();
		node.children?.forEach(child => this.appendChildToParent(fragment, child, contextStack, parentNode));
		return fragment;
	}
	appendChildToParent(fragmentParent: HTMLElement | DocumentFragment, child: DOMNode, contextStack: Stack, parentNode: Node) {
		if (child instanceof DOMElementNode) {
			if (this.isTemplateRefName(child)) {
				const templateRefName = child.templateRefName!;
				// const oldRef = this.templateNameScope.get(templateRefName.name);
				// if (oldRef) {
				// 	return;
				// }
				// TODO: extract template expression
				const templateRef = new TemplateRefImpl(
					this,
					new DOMFragmentNode(child.children),
					contextStack.copyStack(),
					[]
				);
				this.templateNameScope.set(templateRefName.name, templateRef);
				return;
			}
			fragmentParent.append(this.createElement(child, contextStack, parentNode));
		} else if (child instanceof DOMDirectiveNode) {
			const comment = document.createComment(`start ${child.name} = ${child.value}`);
			fragmentParent.append(comment);
			const lastComment = document.createComment(`end ${child.name} = ${child.value}`);
			comment.after(lastComment);
			this.createStructuralDirective(child, comment, contextStack, parentNode);
		} else if (isLiveTextContent(child)) {
			fragmentParent.append(this.createLiveText(child, contextStack, parentNode));
		} else if (child instanceof TextContent) {
			fragmentParent.append(this.createText(child));
		} else if (child instanceof CommentNode) {
			fragmentParent.append(this.createComment(child));
		} else if (child instanceof DOMFragmentNode) {
			fragmentParent.append(this.createDocumentFragment(child, contextStack, parentNode));
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
	createElement(node: DOMElementNode, contextStack: Stack, parentNode: Node): HTMLElement {
		const element = this.createElementByTagName(node);
		const elContext = isHTMLComponent(element) ? element._viewScope : new ElementReactiveScope(element);
		contextStack = contextStack.copyStack();
		contextStack.pushScope(elContext);
		this.initAttribute(element, node, contextStack);
		const templateRefName = node.templateRefName;
		if (templateRefName) {
			Reflect.set(this.view, templateRefName.name, element);
			const view = this.componentRef.viewChild.find(child => child.selector === templateRefName.name);
			if (view) {
				Reflect.set(this.view._model, view.modelName, element);
			}
		}
		if (node.children) {
			for (const child of node.children) {
				this.appendChildToParent(element, child, contextStack, element);
			}
		}
		return element;
	}
	initAttribute(element: HTMLElement, node: DOMElementNode, contextStack: Stack): void {
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
				// (attr.node as ExpressionNode).set(contextStack, attr.value);
			});
		}
		if (node.twoWayBinding?.length) {
			node.twoWayBinding.forEach(attr => {
				this.bind2Way(element, attr, contextStack);
			});
		}
		if (node.inputs?.length) {
			node.inputs.forEach(attr => {
				this.bind1Way(element, attr, contextStack);
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
						event.expression.get(stack, this.view._proxyModel);
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
				this.bind1Way(element, attr, contextStack);
			});
		}
	}

	initDirectiveAttributes(directive: StructuralDirective, node: DOMDirectiveNode, contextStack: Stack): void {
		if (node.attributes?.length) {
			node.attributes.forEach(attr => Reflect.set(directive, attr.name, attr.value));
		}
		if (node.twoWayBinding?.length) {
			node.twoWayBinding.forEach(attr => {
				this.bind2Way(directive, attr, contextStack);
			});
		}
		if (node.inputs?.length) {
			node.inputs.forEach(attr => {
				this.bind1Way(directive, attr, contextStack);
			});
		}
		if (node.outputs?.length) {
			node.outputs.forEach(event => {
				const listener = ($event: Event) => {
					const stack = contextStack.copyStack();
					stack.pushBlockScopeFor({ $event });
					event.expression.get(stack, this.view._proxyModel);
				};
				((<any>directive)[event.name] as any).subscribe(listener);
			});
		}
		if (node.templateAttrs?.length) {
			node.templateAttrs.forEach(attr => {
				this.bind1Way(directive, attr, contextStack);
			});
		}
	}

	bind1Way(element: HTMLElement | StructuralDirective | Text, attr: LiveAttribute | LiveTextContent, contextStack: Stack) {
		const callback = () => {
			attr.expression.get(contextStack);
		};
		this.subscribeExpressionNode(attr.expression, contextStack, callback, element, attr.name, attr.expressionEvent);
		callback();
	}
	subscribeExpressionNode(node: ExpressionNode, contextStack: Stack, callback: SourceFollowerCallback, object?: object, attrName?: string, events?: ExpressionEventMap) {
		events ??= node.events();
		const scopeMap = findScopeMap(events, contextStack);
		scopeMap.forEach((scope, eventName) => {
			const context = scope.getContext();
			if (context) {
				if (scope instanceof AsyncPipeProvider) {
					const pipe: PipeTransform<any, any> = contextStack.get(eventName);
					subscribe1way(pipe, eventName, callback, object, attrName);
					if (isOnDestroy(pipe)) {
						this.view._model.subscribeModel('destroy', () => {
							if (isModel(pipe)) {
								pipe.emitChangeModel('destroy');
							}
							pipe.onDestroy();
						});
					}
					const pipeContext: { [key: string]: Function; } = {};
					pipeContext[eventName] = (value: any, ...args: any[]) => pipe.transform(value, ...args);
					contextStack.pushBlockScopeFor(pipeContext);
				} else if (!(scope instanceof PipeProvider)) {
					subscribe1way(context, eventName, callback, object, attrName);
				}
			}
		});
	}
	bind2Way(element: HTMLElement | StructuralDirective, attr: LiveAttribute, contextStack: Stack) {
		const callback1 = () => {
			attr.expression.get(contextStack);
		};
		const callback2 = () => {
			attr.callbackExpression.get(contextStack);
		};
		const scopeMap = findScopeMap(attr.expressionEvent, contextStack);
		scopeMap.forEach((scope, eventName) => {
			const context = scope.getContext();
			if (context) {
				if (scope instanceof AsyncPipeProvider) {
					const pipe: PipeTransform<any, any> = contextStack.get(eventName);
					subscribe2way(pipe, eventName, callback1, element, attr.name, callback2);
					if (isOnDestroy(pipe)) {
						this.view._model.subscribeModel('destroy', () => {
							if (isModel(pipe)) {
								pipe.emitChangeModel('destroy');
							}
							pipe.onDestroy();
						});
					}
					const pipeContext: { [key: string]: Function } = {};
					pipeContext[eventName] = (value: any, ...args: any[]) => pipe.transform(value, ...args);
					contextStack.pushBlockScopeFor(pipeContext);
				} else if (!(scope instanceof PipeProvider)) {
					subscribe2way(context, eventName, callback1, element, attr.name, callback2);
				}
			}
		});

		callback1();
		if (element instanceof StructuralDirective) {
			return;
		}
		const changeEventName = getChangeEventName(element, attr.name);
		if ((changeEventName === 'input' || changeEventName === 'change')
			&& isModel(element)) {
			element.addEventListener(changeEventName, () => {
				element.emitChangeModel(attr.name);
			});
		}
		else if (isHTMLComponent(element)) {
			// ignore, it is applied by default
		}
		else {
			this.nativeElementMutation.subscribe(element, attr.name, () => {
				if (isModel(element)) {
					element.emitChangeModel(attr.name);
				}
			});
		}
	}

}
