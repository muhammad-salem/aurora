import {
	AssignmentNode, ExpressionNode, MemberAccessNode,
	ScopedStack, ThisNode
} from '@ibyar/expressions';
import {
	CommentNode, DOMChild, DOMDirectiveNode,
	DOMElementNode, DOMFragmentNode, DOMNode,
	DOMParentNode, isTagNameNative, isValidCustomElementName,
	LiveAttribute, LiveTextContent, NodeFactory, TextContent
} from '@ibyar/elements';
import { ComponentRef, ListenerRef } from '../component/component.js';
import { ElementMutation } from './mutation.js';
import { HTMLComponent, isHTMLComponent } from '../component/custom-element.js';
import { documentStack } from '../context/stack.js';
import { ClassRegistryProvider } from '../providers/provider.js';
import { EventEmitter } from '../component/events.js';
import { isOnDestroy, isOnInit } from '../component/lifecycle.js';
import { hasAttr } from '../utils/elements-util.js';
import { isModel, Model, subscribe1way, subscribe2way } from '../model/change-detection.js';
import { AsyncPipeProvider, PipeTransform } from '../pipe/pipe.js';

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
	templateRegExp: RegExp;
	nativeElementMutation: ElementMutation;
	viewChildMap: { [name: string]: any };
	contextStack: ScopedStack;
	constructor(public view: HTMLComponent<T>) {
		this.componentRef = this.view.getComponentRef();
		this.templateRegExp = (/\{\{((\w| |\.|\+|-|\*|\\)*(\(\))?)\}\}/g);
		this.contextStack = documentStack.newStack();
		this.contextStack.addProvider(this.view);
		this.contextStack.addProvider(this.view._model);
	}
	initView(): void {
		if (this.componentRef.template) {
			if (typeof this.componentRef.template === 'function') {
				this.template = this.componentRef.template(this.view._model);
			} else {
				this.template = this.componentRef.template;
			}

			this.viewChildMap = {};
			if (!(this.template instanceof CommentNode)) {
				this.defineElementNameKey(this.template, this.contextStack);
			}

			this.componentRef.viewChild.forEach(view => {
				// support for string selector 
				let selectorName: string = view.selector as string;
				if (Reflect.has(this.viewChildMap, selectorName)) {
					Reflect.set(this.view._model, view.modelName, this.viewChildMap[selectorName]);
				}
			});

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
			this.appendChildToParent(rootRef, this.template, this.contextStack);
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
					this.view._model[listener.modelCallbackName](event);
				});
				return;
			} else if (eventSource in this.view) {
				source = Reflect.get(this.view, eventSource);
				if (!Reflect.has(source, '_model')) {
					this.addNativeEventListener(source, eventName, (event: any) => {
						this.view._model[listener.modelCallbackName](event);
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
				this.view._model[listener.modelCallbackName](value);
			});
		}
		else if (Reflect.has(source, 'on' + eventName)) {
			this.addNativeEventListener(source, eventName, (event: any) => {
				this.view._model[listener.modelCallbackName](event);
			});
		}
		// else if (this.componentRef.encapsulation === 'template' && !this.view.hasParentComponent()) {
		// 	this.addNativeEventListener(this.view, eventName, eventCallback);
		// }
		else if (eventName in this.view._model) {
			this.addNativeEventListener(this.view, eventName, (event: any) => {
				this.view._model[listener.modelCallbackName](event);
			});
		}
	}
	addNativeEventListener(source: HTMLElement | Window, eventName: string, funcCallback: Function) {
		source.addEventListener(eventName, (event: Event) => {
			funcCallback.call(this.view._model, event);
		});
	}
	defineElementNameKey(component: DOMNode<ExpressionNode>, contextStack: ScopedStack) {
		if (component instanceof DOMDirectiveNode || component instanceof CommentNode) {
			return;
		}
		if (component instanceof DOMElementNode) {
			if (NodeFactory.DirectiveTag === component.tagName.toLowerCase()) {
				return;
			}
			if (component.templateRefName) {
				const element = this.createElementByTagName(component, contextStack);
				Reflect.set(this.view, component.templateRefName.name, element);
				this.viewChildMap[component.templateRefName.name] = element;
			}
		}
		if (component instanceof DOMParentNode && component.children) {
			component.children.forEach(child => {
				if ((child instanceof DOMElementNode && NodeFactory.DirectiveTag !== child.tagName.toLowerCase())
					|| child instanceof DOMFragmentNode) {
					this.defineElementNameKey(child, contextStack);
				}
			});
		}
	}
	getElementByName(name: string) {
		return Reflect.get(this.view, name);
	}
	createDirective(directive: DOMDirectiveNode<ExpressionNode>, comment: Comment, contextStack: ScopedStack): void {
		const directiveRef = ClassRegistryProvider.getDirectiveRef<T>(directive.directiveName);
		if (directiveRef) {
			// structural directive selector
			const structural = new directiveRef.modelClass(this, comment, directive, contextStack);
			if (directive.templateRefName) {
				Reflect.set(this.view, directive.templateRefName.name, structural);
				this.viewChildMap[directive.templateRefName.name] = structural;
			}
			if (isOnInit(structural)) {
				structural.onInit();
			}
			// 
		} else {
			// didn't fond directive or it didn't defined yet.
		}
	}
	createComment(node: CommentNode): Comment {
		return document.createComment(`${node.comment}`);
	}
	createText(node: TextContent): Text {
		return new Text(node.value);
	}
	createLiveText(node: LiveTextContent<ExpressionNode>, contextStack: ScopedStack): Text {
		const liveText = new Text('');
		this.bind1Way(liveText, node, contextStack);
		return liveText;
	}
	createDocumentFragment(node: DOMFragmentNode<ExpressionNode>, contextStack: ScopedStack): DocumentFragment {
		let fragment = document.createDocumentFragment();
		node.children.forEach(child => this.appendChildToParent(fragment, child, contextStack), contextStack);
		return fragment;
	}
	private appendChildToParent(parent: HTMLElement | DocumentFragment, child: DOMChild<ExpressionNode> | DOMFragmentNode<ExpressionNode>, contextStack: ScopedStack) {
		if (child instanceof DOMElementNode) {
			parent.append(this.createElement(child, contextStack));
		} else if (child instanceof DOMDirectiveNode) {
			let comment = document.createComment(`${child.directiveName}=${child.directiveValue}`);
			parent.append(comment);
			this.createDirective(child, comment, contextStack);
		} else if (child instanceof TextContent) {
			parent.append(this.createText(child));
		} else if (child instanceof LiveTextContent) {
			parent.append(this.createLiveText(child, contextStack));
		} else if (child instanceof CommentNode) {
			parent.append(this.createComment(child));
		} else if (child instanceof DOMFragmentNode) {
			parent.append(this.createDocumentFragment(child, contextStack));
		}
	}
	createElementByTagName(node: DOMElementNode<ExpressionNode>, contextStack: ScopedStack): HTMLElement {
		let element: HTMLElement;
		if (isValidCustomElementName(node.tagName)) {
			element = document.createElement(node.tagName);
			if (element.constructor.name === 'HTMLElement') {
				customElements.whenDefined(node.tagName).then(() => {
					customElements.upgrade(element);
					let ViewClass = customElements.get(node.tagName);
					if (!(element instanceof ViewClass)) {
						const newChild = this.createElement(node, contextStack);
						element.replaceWith(newChild);
					}
				});
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
	createElement(node: DOMElementNode<ExpressionNode>, contextStack: ScopedStack): HTMLElement {
		let element: HTMLElement;
		if (this.viewChildMap[node.templateRefName?.name || '#']) {
			element = this.viewChildMap[node.templateRefName?.name] as HTMLElement;
		} else {
			element = this.createElementByTagName(node, contextStack);
		}

		this.initAttribute(element, node, contextStack);

		if (node.children) {
			for (const child of node.children) {
				this.appendChildToParent(element, child, contextStack);
			}
		}
		return element;
	}
	initAttribute(element: HTMLElement, node: DOMElementNode<ExpressionNode>, contextStack: ScopedStack): void {
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
			});
		}
		if (node.twoWayBinding) {
			node.twoWayBinding.forEach(attr => {
				//TODO check for attribute directive, find sources from expression
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
				 * TODO diff of event listener and back-way data binding
				 */
				if (typeof event.value === 'string') {
					listener = ($event: Event) => {
						event.valueNode.get(contextStack.stackFor({ $event }), this.view._model);
					};
				} else /* if (typeof event.sourceHandler === 'function')*/ {
					// let eventName: keyof HTMLElementEventMap = event.eventName;
					listener = event.value;
				}
				this.view.addEventListener(event.name as any, listener as any);
			});
		}
		if (node.templateAttrs) {
			node.templateAttrs.forEach(attr => {
				const isAttr = hasAttr(element, attr.name);
				this.bind1Way(element, attr, contextStack);
				// this.attrTemplateHandler(element, attr, isAttr, contextStack);
			});
		}
	}

	bind1Way(element: HTMLElement | Text, attr: LiveAttribute<ExpressionNode>, contextStack: ScopedStack) {
		let leftNode = new MemberAccessNode(ThisNode, attr.nameNode);
		let rightNode = attr.valueNode;
		let forwardData = new AssignmentNode('=', leftNode, rightNode);
		contextStack = contextStack.stackFor({ this: element });
		const callback1 = () => {
			forwardData.get(contextStack);
		};
		rightNode.event().forEach(eventName => {
			const context = contextStack.getProviderBy(eventName);
			if (context) {
				if (AsyncPipeProvider.AsyncPipeContext === context) {
					const pipe: PipeTransform<any, any> = contextStack.get(eventName);
					subscribe1way(pipe, eventName, element, attr.name, callback1);
					if (isOnDestroy(pipe)) {
						this.view._model.subscribeModel('destroy', () => pipe.onDestroy());
					}
					const pipeContext: { [key: string]: Function } = {};
					pipeContext[eventName] = pipe.transform.bind(pipe);
					contextStack.addProvider(pipeContext);
				} else {
					subscribe1way(context, eventName, element, attr.name, callback1);
				}
			}
		});
		callback1();
	}
	bind2Way(element: HTMLElement, attr: LiveAttribute<ExpressionNode>, contextStack: ScopedStack) {
		let leftNode = new MemberAccessNode(ThisNode, attr.nameNode);
		let rightNode = attr.valueNode;
		let forwardData = new AssignmentNode('=', leftNode, rightNode);
		let backwardData = new AssignmentNode('=', rightNode, leftNode);

		contextStack = contextStack.stackFor({ this: element });
		const callback1 = () => {
			forwardData.get(contextStack);
		};
		const callback2 = () => {
			backwardData.get(contextStack);
		};

		rightNode.event().forEach(eventName => {
			const context = contextStack.getProviderBy(eventName);
			if (context) {
				if (AsyncPipeProvider.AsyncPipeContext === context) {
					const pipe: PipeTransform<any, any> = contextStack.get(eventName);
					subscribe2way(pipe, eventName, element, attr.name, callback1, callback2);
					if (isOnDestroy(pipe)) {
						this.view._model.subscribeModel('destroy', () => pipe.onDestroy());
					}
					const pipeContext: { [key: string]: Function } = {};
					pipeContext[eventName] = pipe.transform.bind(pipe);
					contextStack.addProvider(pipeContext);
				} else {
					subscribe2way(context, eventName, element, attr.name, callback1, callback2);
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
			}
			this.nativeElementMutation.subscribe(element, attr.name, () => {
				if (isModel(element)) {
					element.emitChangeModel(attr.name);
				}
			});
		}
	}

}
