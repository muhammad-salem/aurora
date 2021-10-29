import { ExpressionEventMap, ExpressionNode, Stack } from '@ibyar/expressions';
import {
	CommentNode, DOMDirectiveNode,
	DOMElementNode, DOMFragmentNode, DOMNode,
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
import { ElementReactiveScope } from '../directive/providers.js';
import { findScopeMap } from './events.js';

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
export class ComponentRender<T> {
	componentRef: ComponentRef<T>;
	template: DOMNode<ExpressionNode>;
	nativeElementMutation: ElementMutation | undefined;
	contextStack: Stack;
	templateRefMap = new Map<string, DOMElementNode<ExpressionNode>>();
	constructor(public view: HTMLComponent<T>) {
		this.componentRef = this.view.getComponentRef();
		this.contextStack = documentStack.copyStack();
		this.contextStack.pushFunctionScope(); // to protect documentStack
		this.contextStack.pushScope(this.view._viewScope);
		this.contextStack.pushScope(this.view._modelScope);
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
			this.appendChildToParent(rootFragment, this.template, this.contextStack);
			rootRef.append(rootFragment);
		}
	}
	isTemplateRefName(template: DOMNode<ExpressionNode>): template is DOMElementNode<ExpressionNode> {
		if (template instanceof DOMElementNode) {
			if (template.tagName === 'template' && template.templateRefName) {
				return true;
			}
		}
		return false;
	}
	initTemplateRefMap(domNode: DOMNode<ExpressionNode>) {
		if (domNode instanceof DOMElementNode || domNode instanceof DOMDirectiveNode || domNode instanceof DOMFragmentNode) {
			if (domNode.children) {
				const toRemove: { index: number, template: DOMElementNode<ExpressionNode> }[] = [];
				for (let index = 0; index < domNode.children.length; index++) {
					const child = domNode.children[index];
					if (this.isTemplateRefName(child)) {
						toRemove.unshift({ index, template: child });
					} else {
						this.initTemplateRefMap(child);
					}
				}
				toRemove.forEach(info => {
					this.templateRefMap.set(info.template.templateRefName.name, info.template);
					domNode.children.splice(info.index, 1);
				});
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
	createDirective(directive: DOMDirectiveNode<ExpressionNode>, comment: Comment, directiveStack: Stack): void {
		const directiveRef = ClassRegistryProvider.getDirectiveRef<T>(directive.directiveName);
		if (directiveRef) {
			// structural directive selector
			const structural = new directiveRef.modelClass(this, comment, directive, directiveStack.copyStack());
			if (isOnInit(structural)) {
				structural.onInit();
			}
			if (isOnDestroy(structural)) {
				this.view._model.subscribeModel('destroy', () => {
					if (isModel(structural)) {
						structural.emitChangeModel('destroy');
					}
					structural.onDestroy();
				});
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
	createLiveText(textNode: LiveTextContent<ExpressionNode>, contextStack: Stack): Text {
		const liveText = new Text('');
		contextStack = contextStack.copyStack();
		contextStack.pushBlockScopeFor({ this: liveText });
		this.bind1Way(liveText, textNode, contextStack);
		return liveText;
	}
	createDocumentFragment(node: DOMFragmentNode<ExpressionNode>, contextStack: Stack): DocumentFragment {
		const fragment = document.createDocumentFragment();
		node.children.forEach(child => this.appendChildToParent(fragment, child, contextStack));
		return fragment;
	}
	appendChildToParent(parent: HTMLElement | DocumentFragment, child: DOMNode<ExpressionNode>, contextStack: Stack) {
		if (child instanceof DOMElementNode) {
			parent.append(this.createElement(child, contextStack));
		} else if (child instanceof DOMDirectiveNode) {
			const comment = document.createComment(`start ${child.directiveName}: ${child.directiveValue}`);
			parent.append(comment);
			const lastComment = document.createComment(`end ${child.directiveName}: ${child.directiveValue}`);
			comment.after(lastComment);
			this.createDirective(child, comment, contextStack);
		} else if (child instanceof LiveTextContent) {
			parent.append(this.createLiveText(child, contextStack));
		} else if (child instanceof TextContent) {
			parent.append(this.createText(child));
		} else if (child instanceof CommentNode) {
			parent.append(this.createComment(child));
		} else if (child instanceof DOMFragmentNode) {
			parent.append(this.createDocumentFragment(child, contextStack));
		}
	}
	createElementByTagName(node: DOMElementNode<ExpressionNode>): HTMLElement {
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
	createElement(node: DOMElementNode<ExpressionNode>, contextStack: Stack): HTMLElement {
		const element = this.createElementByTagName(node);
		const elContext = isHTMLComponent(element) ? element._viewScope : new ElementReactiveScope(element);
		contextStack = contextStack.copyStack();
		contextStack.pushScope(elContext);
		this.initAttribute(element, node, contextStack);
		if (node.templateRefName) {
			Reflect.set(this.view, node.templateRefName.name, element);
			const view = this.componentRef.viewChild.find(child => child.selector === node.templateRefName.name);
			if (view) {
				Reflect.set(this.view._model, view.modelName, element);
			}
		}
		if (node.children) {
			for (const child of node.children) {
				this.appendChildToParent(element, child, contextStack);
			}
		}
		return element;
	}
	initAttribute(element: HTMLElement, node: DOMElementNode<ExpressionNode>, contextStack: Stack): void {
		if (node.attributes) {
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
		if (node.twoWayBinding) {
			node.twoWayBinding.forEach(attr => {
				this.bind2Way(element, attr, contextStack);
			});
		}
		if (node.inputs) {
			node.inputs.forEach(attr => {
				this.bind1Way(element, attr, contextStack);
			});
		}
		if (node.outputs) {
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
		if (node.templateAttrs) {
			node.templateAttrs.forEach(attr => {
				this.bind1Way(element, attr, contextStack);
			});
		}
	}

	bind1Way(element: HTMLElement | Text, attr: LiveAttribute<ExpressionNode> | LiveTextContent<ExpressionNode>, contextStack: Stack) {
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
				if (AsyncPipeProvider.AsyncPipeContext === context) {
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
				} else if (PipeProvider.PipeContext !== context) {
					subscribe1way(context, eventName, callback, object, attrName);
				}
			}
		});
	}
	bind2Way(element: HTMLElement, attr: LiveAttribute<ExpressionNode>, contextStack: Stack) {
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
				if (AsyncPipeProvider.AsyncPipeContext === context) {
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
				} else if (PipeProvider.PipeContext !== context) {
					subscribe2way(context, eventName, callback1, element, attr.name, callback2);
				}
			}
		});

		callback1();
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
			if (!this.nativeElementMutation) {
				this.nativeElementMutation = new ElementMutation();
				this.view._model.subscribeModel('destroy', () => {
					this.nativeElementMutation?.disconnect();
					this.nativeElementMutation = undefined;
				});
			}
			this.nativeElementMutation.subscribeOnAttribute(element, attr.name, () => {
				if (isModel(element)) {
					element.emitChangeModel(attr.name);
				}
			});
		}
	}

}
