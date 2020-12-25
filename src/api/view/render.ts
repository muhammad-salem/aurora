import { AssignmentNode, MemberNode, NodeExpression, parseJSExpression, PropertyNode } from '@aurorats/expression';
import {
	Aurora, AuroraChild, AuroraNode, CommentNode,
	DirectiveNode, ElementNode, FragmentNode,
	LiveText, ParentNode, TextNode
} from '@aurorats/jsx';
import { isTagNameNative, isValidCustomElementName } from '@aurorats/element';
import { HTMLComponent, isHTMLComponent } from '../component/custom-element.js';
import { EventEmitter } from '../component/events.js';
import { isOnInit } from '../component/lifecycle.js';
import { defineModel, isModel, Model, SourceFollwerCallback, subscribe1way, subscribe2way } from '../model/change-detection.js';
import { dependencyInjector } from '../providers/injector.js';
import { ClassRegistry } from '../providers/provider.js';
import { ComponentRef, ListenerRef, PropertyRef } from '../component/component.js';
import { hasAttr } from '../utils/elements-util.js';
import { ElementMutation } from './mutation.js';

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

export interface PropertySource {
	property: string, src: any, expression?: NodeExpression;
}

export class ComponentRender<T> {
	componentRef: ComponentRef<T>
	template: AuroraNode;
	templateRegExp: RegExp;
	nativeElementMutation: ElementMutation;

	viewChildMap: { [name: string]: any };

	constructor(public view: HTMLComponent<T>) {
		this.componentRef = view.getComponentRef();
		this.templateRegExp = (/\{\{((\w| |\.|\+|-|\*|\\)*(\(\))?)\}\}/g);
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

				this.defineElementNameKey(this.template);
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
			this.appendChildToParent(rootRef, this.template);
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
		const output = dependencyInjector
			.getInstance(ClassRegistry)
			.hasOutput(sourceModel, eventName);
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

	defineElementNameKey(component: AuroraNode) {
		if (component instanceof DirectiveNode || component instanceof CommentNode) {
			return;
		}
		if (component instanceof ElementNode) {
			if (Aurora.DirectiveTag === component.tagName.toLowerCase()) {
				return;
			}
			if (component.templateRefName) {
				const element = this.createElementByTagName(component);
				Reflect.set(this.view, component.templateRefName.attrName, element);
				this.viewChildMap[component.templateRefName.attrName] = element;
			}
		}
		if (component instanceof ParentNode && component.children) {
			component.children.forEach(child => {
				if ((child instanceof ElementNode && Aurora.DirectiveTag !== child.tagName.toLowerCase())
					|| child instanceof FragmentNode) {
					this.defineElementNameKey(child);
				}
			});
		}
	}

	getElementByName(name: string) {
		return Reflect.get(this.view, name);
	}

	createDirective(directive: DirectiveNode, comment: Comment, additionalSources?: PropertySource[]): void {
		const directiveRef = dependencyInjector.getInstance(ClassRegistry).getDirectiveRef<T>(directive.directiveName);
		if (directiveRef) {
			// structural directive selector as '*if'
			const structural = new directiveRef.modelClass(this, comment, directive);
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

	createLiveText(text: LiveText, additionalSources?: PropertySource[]): Text {
		const liveText = new Text('');
		this.bind1Way(liveText, 'textContent', text.textValue, additionalSources);
		return liveText;
	}

	createDocumentFragment(node: FragmentNode, additionalSources?: PropertySource[]): DocumentFragment {
		let fragment = document.createDocumentFragment();
		node.children.forEach(child => this.appendChildToParent(fragment, child), additionalSources);
		return fragment;
	}

	private appendChildToParent(parent: HTMLElement | DocumentFragment, child: AuroraChild | FragmentNode, additionalSources?: PropertySource[]) {
		if (child instanceof ElementNode) {
			parent.append(this.createElement(child, additionalSources));
		} else if (child instanceof DirectiveNode) {
			let comment = document.createComment(`${child.directiveName}=${child.directiveValue}`);
			parent.append(comment);
			this.createDirective(child, comment, additionalSources);
		} else if (child instanceof TextNode) {
			parent.append(this.createText(child));
		} else if (child instanceof LiveText) {
			parent.append(this.createLiveText(child, additionalSources));
		} else if (child instanceof CommentNode) {
			parent.append(this.createComment(child));
		} else if (child instanceof FragmentNode) {
			parent.append(this.createDocumentFragment(child, additionalSources));
		}
	}

	createElementByTagName(node: ElementNode): HTMLElement {
		let element: HTMLElement;
		if (isValidCustomElementName(node.tagName)) {
			element = document.createElement(node.tagName);
			if (element.constructor.name === 'HTMLElement') {
				customElements.whenDefined(node.tagName).then(() => {
					customElements.upgrade(element);
					let ViewClass = customElements.get(node.tagName);
					if (!(element instanceof ViewClass)) {
						const newChild = this.createElement(node);
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

	createElement(node: ElementNode, additionalSources?: PropertySource[]): HTMLElement {
		let element: HTMLElement;
		if (this.viewChildMap[node.templateRefName?.attrName || '#']) {
			element = this.viewChildMap[node.templateRefName?.attrName] as HTMLElement;
		} else {
			element = this.createElementByTagName(node);
		}

		this.initAttribute(element, node, additionalSources);

		if (node.children) {
			for (const child of node.children) {
				this.appendChildToParent(element, child, additionalSources);
			}
		}
		return element;
	}

	initAttribute(element: HTMLElement, node: ElementNode, additionalSources?: PropertySource[]): void {
		if (node.attributes) {
			node.attributes.forEach(attr => {
				/**
				 * <input id="23" name="person-name" onchange="onPersonNameChange($event)" />
				 * <a onclick="onLinkClick()"></a>
				 * <a onClick="onLinkClick()"></a>
				 */
				// console.log('name', attr.attrName);
				const isAttr = hasAttr(element, attr.attrName);
				// this.initElementData(element, attr.attrName, attr.attrValue as string, isAttr);
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
				this.bind2Way(element, attr.attrName, attr.sourceValue, additionalSources);
			});
		}
		if (node.inputs) {
			node.inputs.forEach(attr => {
				this.bind1Way(element, attr.attrName, attr.sourceValue, additionalSources);
			});
		}
		if (node.outputs) {
			node.outputs.forEach(event => {
				let listener: Function;
				/**
				 * <a (click)="onLinkClick()"></a>
				 * <input [(value)]="person.name" />
				 * <input (value)="person.name" />
				 * <!-- <input (value)="person.name = $event" /> -->
				 * 
				 * TODO diff of event listener and back-way data binding
				 */
				if (typeof event.sourceHandler === 'string') {
					let expression = parseJSExpression(event.sourceHandler);
					// this.view.addEventListener(event.eventName, ($event) => {
					// 	expression.get({
					// 		$event: $event,
					// 		model: this.view._model
					// 	});
					// });
					listener = expression.get(this.view._model);
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
				// this.initElementData(element, attrName, attrValue as string, isAttr);
				this.attrTemplateHandler(element, tempAttr.attrName, tempAttr.sourceValue, isAttr);
			});
		}
	}

	getEntrySource(entry: string, suggest?: any): any {
		// let input = this.view.getInput(entry);
		if (suggest && Reflect.has(suggest, entry)) {
			return suggest;
		} else if (Reflect.has(this.view, entry)) {
			return this.view;
		} else if (Reflect.has(this.view._model, entry)) {
			return this.view._model;
		}
		// search in directives and pipes
		return window;
	}

	getPropertySource(viewProperty: string): PropertySource | undefined {
		let input = this.view.getInputStartWith(viewProperty);
		let dotIndex = viewProperty.indexOf('.');
		let modelProperty = viewProperty;
		if (dotIndex > 0 && input) {
			modelProperty = input.modelProperty + viewProperty.substring(dotIndex);
		} else if (input) {
			modelProperty = input.modelProperty;
		}
		let parent: any = viewProperty;
		if (dotIndex > 0) {
			parent = viewProperty.substring(0, dotIndex);
		}
		if (Reflect.has(this.view, parent)) {
			// parent = Reflect.get(this.view, parent);
			// /**
			//  * case of element reference
			//  * <root-app>
			//  * 	<app-tag #element-name ></app-tag>
			//  * </root-app>
			//  */
			// if (parent instanceof HTMLElement) {
			// 	return { property: modelProperty.substring(dotIndex + 1), src: parent, expression };
			// }
			return { property: modelProperty, src: this.view };
		}
		else if (Reflect.has(this.view._model, parent)) {
			return { property: modelProperty, src: this.view._model };
		}
	}

	initElementData(element: HTMLElement, elementAttr: string, viewProperty: string, isAttr: boolean) {
		const propertySrc = this.getPropertySource(viewProperty);
		if (!propertySrc) {
			return;
		}
		let exp: string;
		if (isAttr) {
			exp = `element.setAttribute('${elementAttr}', model.${viewProperty})`;
		} else {
			exp = `element['${elementAttr}'] = model.${viewProperty}`;
		}
		let expNodeDown = parseJSExpression(exp);
		let context = {
			element: element,
			model: propertySrc.src
		};
		expNodeDown.get(context);
	}


	bind1Way(element: HTMLElement | Text, elementAttr: string, viewProperty: string, additionalSources?: PropertySource[]) {
		let thisElement = new PropertyNode('this');
		let leftNode = new MemberNode('.', thisElement, parseJSExpression(elementAttr));
		let rightNode = parseJSExpression(viewProperty);
		let forwardData = new AssignmentNode('=', leftNode, rightNode);

		const entries = rightNode.entry().map(key => this.getPropertySource(key)).filter(source => source) as PropertySource[];
		if (additionalSources) {
			entries.push(...additionalSources);
		}
		const context = Object.create(null);
		const thisRender = this;
		const proxyContext = new Proxy<typeof context>(context, {
			get(target: typeof context, p: PropertyKey, receiver: any): any {
				if (p === 'this') {
					return element;
				}
				let propertySrc = entries.find(src => src.property === p as string);
				if (!propertySrc) {
					propertySrc = thisRender.getPropertySource(p as string);
					if (!propertySrc) {
						// TODO should return value
						return;
					}
				}
				if (p in propertySrc.src) {
					return propertySrc.src[p];
				}
				return propertySrc.src;
			},
			set(target: typeof context, p: PropertyKey, value: any, receiver: any): boolean {
				const propertySrc = entries.find(src => src.property === p as string);
				return Reflect.set(propertySrc?.src, p, value);
			}
		});

		const callback1: SourceFollwerCallback = (stack: any[]) => {
			forwardData.get(proxyContext);
		};

		entries.forEach(propertySrc => {
			subscribe1way(propertySrc.src, propertySrc.property, element, elementAttr, callback1);
		});

		forwardData.get(proxyContext);
	}

	bind2Way(element: HTMLElement, elementAttr: string, viewProperty: string, additionalSources?: PropertySource[]) {

		let thisElement = new PropertyNode('this');
		let leftNode = new MemberNode('.', thisElement, parseJSExpression(elementAttr));
		let rightNode = parseJSExpression(viewProperty);
		let forwardData = new AssignmentNode('=', leftNode, rightNode);
		let backwardData = new AssignmentNode('=', rightNode, leftNode);

		const entries = rightNode.entry().map(key => this.getPropertySource(key)).filter(source => source) as PropertySource[];
		if (additionalSources) {
			entries.push(...additionalSources);
		}
		const context = Object.create(null);
		const thisRender = this;
		const proxyContext = new Proxy<typeof context>(context, {
			get(target: typeof context, p: PropertyKey, receiver: any): any {
				if (p === 'this') {
					return element;
				}
				let propertySrc = entries.find(src => src.property === p as string);
				if (!propertySrc) {
					propertySrc = thisRender.getPropertySource(p as string);
					if (!propertySrc) {
						// TODO should return value
						return;
					}
				}
				if (p in propertySrc.src) {
					return propertySrc.src[p];
				}
				return propertySrc.src;
			},
			set(target: typeof context, p: PropertyKey, value: any, receiver: any): boolean {
				const propertySrc = entries.find(src => src.property === p as string);
				return Reflect.set(propertySrc?.src, p, value);
			}
		});

		const callback1: SourceFollwerCallback = (stack: any[]) => {
			forwardData.get(proxyContext);
		};
		const callback2: SourceFollwerCallback = (stack: any[]) => {
			backwardData.get(proxyContext);
		};

		entries.forEach(propertySrc => {
			subscribe2way(propertySrc.src, propertySrc.property, element, elementAttr, callback1, callback2);
		});

		forwardData.get(proxyContext);
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

	attrTemplateHandler(element: HTMLElement | Text, elementAttr: string, viewProperty: string, isAttr?: boolean) {
		const result = [...viewProperty.matchAll(this.templateRegExp)];
		if (result.length === 0) {
			return;
		}
		const propSrc: { [match: string]: PropertySource } = {};
		result.forEach(match => {
			propSrc[match[0]] = this.getPropertySource(match[1]) as PropertySource;
			propSrc[match[0]].expression = parseJSExpression(match[1]);
		});
		const handler = () => {
			let renderText = viewProperty;
			Object.keys(propSrc).forEach(propTemplate => {
				const prop = propSrc[propTemplate];
				let value = prop.expression?.get(prop.src);
				renderText = renderText.replace(propTemplate, value);
			});
			if (isAttr && element instanceof HTMLElement) {
				element.setAttribute(elementAttr, renderText);
			} else {
				let expNodeDown = parseJSExpression(`element.${elementAttr} = obj`);
				let context = {
					element: element,
					obj: renderText
				};
				expNodeDown.get(context);
			}
		}
		let triggerTemplate: Function | undefined;
		Object.keys(propSrc).forEach(propTemplate => {
			const prop = propSrc[propTemplate];
			let subject1: any;
			if (isHTMLComponent(prop.src)) {
				subject1 = prop.src._model;
			} else {
				subject1 = prop.src;
			}
			defineModel(subject1);
			(subject1 as Model).subscribeModel(prop.property, handler);
			if (!triggerTemplate) {
				triggerTemplate = () => {
					(subject1 as Model).emitChangeModel(prop.property);
				};
			}
		});
		if (triggerTemplate) {
			triggerTemplate();
		}
	}

}
