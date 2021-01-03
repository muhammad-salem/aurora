import { AssignmentNode, MemberNode, NodeExpression, parseJSExpression } from '@aurorats/expression';
import {
	Aurora, AuroraChild, AuroraNode, CommentNode,
	DirectiveNode, ElementNode, FragmentNode,
	LiveText, ParentNode, TextNode
} from '@aurorats/jsx';
import { isTagNameNative, isValidCustomElementName } from '@aurorats/element';
import { HTMLComponent, isHTMLComponent } from '../component/custom-element.js';
import { EventEmitter } from '../component/events.js';
import { isOnInit } from '../component/lifecycle.js';
import { isModel, SourceFollowerCallback, subscribe1way, subscribe2way } from '../model/change-detection.js';
import ClassRegistryProvider from '../providers/provider.js';
import { ComponentRef, ListenerRef, PropertyRef } from '../component/component.js';
import { hasAttr } from '../utils/elements-util.js';
import { ElementMutation } from './mutation.js';
import { ContextDescriptorRef, ContextStack, mergeContextProviders, PropertyMap, TemplatePropertyMap } from '../context/context-provider.js';
import PIPE_CONTEXT_PROVIDER from '../pipe/pipe.js';
import { DUMMY_PROXY_TARGET, THIS_PROPERTY, WINDOW_CONTEXT_PROVIDER } from '../global/global-constant.js';

function getChangeEventName(element: HTMLElement, elementAttr: string): string {
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

	componentRef: ComponentRef<T>
	template: AuroraNode;
	templateRegExp: RegExp;
	nativeElementMutation: ElementMutation;

	viewChildMap: { [name: string]: any };

	contextStack: ContextStack<ContextDescriptorRef>;

	constructor(public view: HTMLComponent<T>) {
		this.componentRef = this.view.getComponentRef();
		this.templateRegExp = (/\{\{((\w| |\.|\+|-|\*|\\)*(\(\))?)\}\}/g);
		this.contextStack = mergeContextProviders<ContextDescriptorRef>(WINDOW_CONTEXT_PROVIDER, PIPE_CONTEXT_PROVIDER, this.view, this.view._model);
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
		let eventName: string = listener.eventName,
			source: HTMLElement | Window,
			eventCallback: Function = this.view._model[listener.modelCallbackName];
		if (listener.eventName.includes(':')) {
			const eventSource = eventName.substring(0, eventName.indexOf(':'));
			eventName = eventName.substring(eventName.indexOf(':') + 1);
			if ('window' === eventSource.toLowerCase()) {
				source = window;
				this.addNativeEventListener(source, eventName, eventCallback);
				return;
			} else if (eventSource in this.view) {
				source = Reflect.get(this.view, eventSource);
				if (!Reflect.has(source, '_model')) {
					this.addNativeEventListener(source, eventName, eventCallback);
					return;
				}
			} else {
				source = this.view;
			}
		} else {
			source = this.view;
		}
		const sourceModel = Reflect.get(source, '_model');
		const output = ClassRegistryProvider.hasOutput(sourceModel, eventName);
		if (output) {
			(sourceModel[(output as PropertyRef).modelProperty] as EventEmitter<any>).subscribe((value: any) => {
				eventCallback.call(sourceModel, value);
			});
		}
		else if (Reflect.has(source, 'on' + eventName)) {
			this.addNativeEventListener(source, eventName, eventCallback);
		}
		// else if (this.componentRef.encapsulation === 'template' && !this.view.hasParentComponent()) {
		// 	this.addNativeEventListener(this.view, eventName, eventCallback);
		// }
		else if (eventName in this.view._model) {
			this.addNativeEventListener(this.view, eventName, eventCallback);
		}
	}

	addNativeEventListener(source: HTMLElement | Window, eventName: string, funcCallback: Function) {
		source.addEventListener(eventName, (event: Event) => {
			funcCallback.call(this.view._model, event);
		});
	}

	defineElementNameKey(component: AuroraNode, contextStack: ContextStack<ContextDescriptorRef>) {
		if (component instanceof DirectiveNode || component instanceof CommentNode) {
			return;
		}
		if (component instanceof ElementNode) {
			if (Aurora.DirectiveTag === component.tagName.toLowerCase()) {
				return;
			}
			if (component.templateRefName) {
				const element = this.createElementByTagName(component, contextStack);
				Reflect.set(this.view, component.templateRefName.attrName, element);
				this.viewChildMap[component.templateRefName.attrName] = element;
			}
		}
		if (component instanceof ParentNode && component.children) {
			component.children.forEach(child => {
				if ((child instanceof ElementNode && Aurora.DirectiveTag !== child.tagName.toLowerCase())
					|| child instanceof FragmentNode) {
					this.defineElementNameKey(child, contextStack);
				}
			});
		}
	}

	getElementByName(name: string) {
		return Reflect.get(this.view, name);
	}

	createDirective(directive: DirectiveNode, comment: Comment, contextStack: ContextStack<ContextDescriptorRef>): void {
		const directiveRef = ClassRegistryProvider.getDirectiveRef<T>(directive.directiveName);
		if (directiveRef) {
			// structural directive selector
			const structural = new directiveRef.modelClass(this, comment, directive, contextStack);
			if (directive.templateRefName) {
				Reflect.set(this.view, directive.templateRefName.attrName, structural);
				this.viewChildMap[directive.templateRefName.attrName] = structural;
			}
			if (isOnInit(structural)) {
				structural.onInit();
			}
			// 
		} else {
			// didn't fond directive or it didn't defined yet.
		}
	}

	createComment(comment: CommentNode): Comment {
		return document.createComment(`${comment.comment}`);
	}

	createText(text: TextNode): Text {
		return new Text(text.textValue);
	}

	createLiveText(text: LiveText, contextStack: ContextStack<ContextDescriptorRef>): Text {
		const liveText = new Text('');
		this.bind1Way(liveText, 'textContent', text.textValue, contextStack);
		return liveText;
	}

	createDocumentFragment(node: FragmentNode, contextStack: ContextStack<ContextDescriptorRef>): DocumentFragment {
		let fragment = document.createDocumentFragment();
		node.children.forEach(child => this.appendChildToParent(fragment, child, contextStack), contextStack);
		return fragment;
	}

	private appendChildToParent(parent: HTMLElement | DocumentFragment, child: AuroraChild | FragmentNode, contextStack: ContextStack<ContextDescriptorRef>) {
		if (child instanceof ElementNode) {
			parent.append(this.createElement(child, contextStack));
		} else if (child instanceof DirectiveNode) {
			let comment = document.createComment(`${child.directiveName}=${child.directiveValue}`);
			parent.append(comment);
			this.createDirective(child, comment, contextStack);
		} else if (child instanceof TextNode) {
			parent.append(this.createText(child));
		} else if (child instanceof LiveText) {
			parent.append(this.createLiveText(child, contextStack));
		} else if (child instanceof CommentNode) {
			parent.append(this.createComment(child));
		} else if (child instanceof FragmentNode) {
			parent.append(this.createDocumentFragment(child, contextStack));
		}
	}

	createElementByTagName(node: ElementNode, contextStack: ContextStack<ContextDescriptorRef>): HTMLElement {
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

	createElement(node: ElementNode, contextStack: ContextStack<ContextDescriptorRef>): HTMLElement {
		let element: HTMLElement;
		if (this.viewChildMap[node.templateRefName?.attrName || '#']) {
			element = this.viewChildMap[node.templateRefName?.attrName] as HTMLElement;
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

	initAttribute(element: HTMLElement, node: ElementNode, contextStack: ContextStack<ContextDescriptorRef>): void {
		if (node.attributes) {
			node.attributes.forEach(attr => {
				/**
				 * <input id="23" name="person-name" onchange="onPersonNameChange($event)" />
				 * <a onclick="onLinkClick()"></a>
				 * <a onClick="onLinkClick()"></a>
				 */
				// console.log('name', attr.attrName);
				const isAttr = hasAttr(element, attr.attrName);
				if (isAttr) {
					if (attr.attrValue === false) {
						element.removeAttribute(attr.attrName);
					} else if (attr.attrValue === true) {
						element.setAttribute(attr.attrName, '');
					} else {
						element.setAttribute(attr.attrName, attr.attrValue as string);
					}
				} else {
					if (attr.attrName.startsWith('on') && typeof attr.attrValue === 'string') {
						let func = parseJSExpression(attr.attrValue);
						element.addEventListener(attr.attrName.substring(2), event => {
							let contextProxy = new Proxy(this.view._model, {
								get: (target: any, p: PropertyKey, receiver: any) => {
									// console.log(p);
									if (p === '$event') {
										return event;
									}
									return Reflect.get(target, p, receiver);
								}
							});
							func.get(contextProxy);
						});
					} else {
						Reflect.set(element, attr.attrName, attr.attrValue);
					}

				}
			});
		}

		if (node.twoWayBinding) {
			node.twoWayBinding.forEach(attr => {
				//TODO check for attribute directive, find sources from expression
				this.bind2Way(element, attr.attrName, attr.sourceValue, contextStack);
			});
		}
		if (node.inputs) {
			node.inputs.forEach(attr => {
				this.bind1Way(element, attr.attrName, attr.sourceValue, contextStack);
			});
		}
		if (node.outputs) {
			node.outputs.forEach(event => {
				let listener: Function;
				/**
				 * <a (click)="onLinkClick($event)"></a>
				 * <input [(value)]="person.name" />
				 * <input (value)="person.name" />
				 * <!-- <input (value)="person.name = $event" /> -->
				 * 
				 * TODO diff of event listener and back-way data binding
				 */
				if (typeof event.sourceHandler === 'string') {
					let expression = parseJSExpression(event.sourceHandler);
					listener = (event: Event) => {
						expression.get(this.view._model);
					};
				} else /* if (typeof event.sourceHandler === 'function')*/ {
					// let eventName: keyof HTMLElementEventMap = event.eventName;
					listener = event.sourceHandler;
				}
				this.view.addEventListener(event.eventName as any, listener as any);
			});
		}
		if (node.templateAttrs) {
			node.templateAttrs.forEach(tempAttr => {
				const isAttr = hasAttr(element, tempAttr.attrName);
				this.attrTemplateHandler(element, tempAttr.attrName, tempAttr.sourceValue, isAttr, contextStack);
			});
		}
	}

	createProxyObject(propertyMaps: PropertyMap[], contextStack: ContextStack<ContextDescriptorRef>, thisRef?: object) {
		const proxyHandler: ProxyHandler<typeof DUMMY_PROXY_TARGET> = {
			get(target: typeof DUMMY_PROXY_TARGET, propertyKey: PropertyKey, receiver: any): any {
				if (propertyKey === 'this') {
					return thisRef;
				}
				let propertyMap = propertyMaps.find(prop => prop.entityName === propertyKey as string);
				if (!propertyMap) {
					propertyMap = { entityName: propertyKey, provider: contextStack.findContextProvider(propertyKey as string) } as PropertyMap;
					if (propertyMap.provider) {
						propertyMaps.push(propertyMap);
					} else {
						// TODO should return value
						return;
					}
				}
				return propertyMap.provider.getContextValue(propertyKey);
			},
			set(target: typeof DUMMY_PROXY_TARGET, propertyKey: PropertyKey, value: any): boolean {
				let propertyMap = propertyMaps.find(src => src.entityName === propertyKey as string);
				if (!propertyMap?.provider) {
					propertyMap = { entityName: propertyKey, provider: contextStack.findContextProvider(propertyKey as string) } as PropertyMap;
					if (propertyMap.provider) {
						propertyMaps.push(propertyMap);
					}
				}
				return propertyMap?.provider.setContextValue(propertyKey, value);
			}
		};
		return new Proxy<typeof DUMMY_PROXY_TARGET>(DUMMY_PROXY_TARGET, proxyHandler);
	}

	getPropertyMaps(node: NodeExpression, contextStack: ContextStack<ContextDescriptorRef>): PropertyMap[] {
		return this.mapPropertyWithProvider(node.entry(), contextStack);
	}

	mapPropertyWithProvider(entries: string[], contextStack: ContextStack<ContextDescriptorRef>): PropertyMap[] {
		const propertyMaps = entries
			.map(entityName => { return { entityName: entityName, provider: contextStack.findContextProvider(entityName) } as PropertyMap; })
			.filter(source => source);
		return propertyMaps;
	}

	bind1Way(element: HTMLElement | Text, elementAttr: string, viewProperty: string, contextStack: ContextStack<ContextDescriptorRef>) {
		let leftNode = new MemberNode('.', THIS_PROPERTY, parseJSExpression(elementAttr));
		let rightNode = parseJSExpression(viewProperty);
		let forwardData = new AssignmentNode('=', leftNode, rightNode);
		const propertyMaps = this.getPropertyMaps(rightNode, contextStack);
		const proxyContext = this.createProxyObject(propertyMaps, contextStack, element);
		const callback1: SourceFollowerCallback = () => {
			forwardData.get(proxyContext);
		};
		propertyMaps.forEach(propertyMap => {
			subscribe1way(propertyMap.provider.getContext(), propertyMap.entityName as string, element, elementAttr, callback1);
		});
		callback1([]);
	}

	bind2Way(element: HTMLElement, elementAttr: string, viewProperty: string, contextStack: ContextStack<ContextDescriptorRef>) {
		let leftNode = new MemberNode('.', THIS_PROPERTY, parseJSExpression(elementAttr));
		let rightNode = parseJSExpression(viewProperty);
		let forwardData = new AssignmentNode('=', leftNode, rightNode);
		let backwardData = new AssignmentNode('=', rightNode, leftNode);

		const propertyMaps = this.getPropertyMaps(rightNode, contextStack);
		const proxyContext = this.createProxyObject(propertyMaps, contextStack, element);

		const callback1: SourceFollowerCallback = () => {
			forwardData.get(proxyContext);
		};
		const callback2: SourceFollowerCallback = () => {
			backwardData.get(proxyContext);
		};

		propertyMaps.forEach(propertyMap => {
			subscribe2way(propertyMap.provider.getContext(), propertyMap.entityName as string, element, elementAttr, callback1, callback2);
		});

		callback1([]);
		const changeEventName = getChangeEventName(element, elementAttr);
		if ((changeEventName === 'input' || changeEventName === 'change')
			&& isModel(element)) {
			element.addEventListener(changeEventName, () => {
				element.emitChangeModel(elementAttr);
			});
		}
		else if (isHTMLComponent(element)) {
			// ignore, it is applied by default
		}
		else {
			if (!this.nativeElementMutation) {
				this.nativeElementMutation = new ElementMutation();
			}
			this.nativeElementMutation.subscribe(element, elementAttr, () => {
				if (isModel(element)) {
					element.emitChangeModel(elementAttr);
				}
			});
		}
	}

	attrTemplateHandler(element: HTMLElement | Text, elementAttr: string, viewProperty: Readonly<string>, isAttr: boolean = false, contextStack: ContextStack<ContextDescriptorRef>) {
		const result = [...viewProperty.matchAll(this.templateRegExp)];
		if (result.length === 0) {
			return;
		}
		const templateMap: TemplatePropertyMap[] = result.map(match => {
			const template = match[0];
			const expression = parseJSExpression(match[1]);
			const propertyMap = this.getPropertyMaps(expression, contextStack);
			const context = this.createProxyObject(propertyMap, contextStack, element);
			return { template, expression, propertyMap, context };
		});
		const handler = () => {
			let renderText = viewProperty;
			templateMap.forEach(prop => {
				let value = prop.expression.get(prop.context);
				renderText = renderText.replace(prop.template, value);
			});
			if (isAttr && element instanceof HTMLElement) {
				element.setAttribute(elementAttr, renderText);
			} else {
				Reflect.set(element, elementAttr, renderText);
			}
		}

		templateMap.flatMap(template => template.propertyMap)
			.filter((value, index, array) => index === array.indexOf(value))
			.forEach(property => {
				subscribe1way(property.provider.getContext(), property.entityName as string, element, elementAttr, handler);
			});
		handler();
	}

}
