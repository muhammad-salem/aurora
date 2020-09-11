import { NodeExpression, parseHtmlExpression } from '@aurorats/expression';
import { jsxAttrComponentBuilder, jsxComponentAttrHandler, JsxFactory } from '@aurorats/jsx';
import { AttrDiscription, isJsxComponentWithElement, isModel, JsxAttrComponent, Model } from '@aurorats/types';
import { HTMLComponent, isHTMLComponent } from '../component/custom-element.js';
import { EventEmitter } from '../component/events.js';
import { isOnInit } from '../component/lifecycle.js';
import { defineModel, subscribe1way, subscribe2way } from '../model/change-detection.js';
import { dependencyInjector } from '../providers/injector.js';
import { ClassRegistry } from '../providers/provider.js';
import { setValueByPath, updateAttribute, updateValue } from '../utils/utils.js';
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

interface PropertySource {
	property: string, src: object, expression: NodeExpression
}

export class ComponentRender<T> {
	componentRef: ComponentRef<T>
	template: JsxAttrComponent;
	templateRegExp: RegExp;
	nativeElementMutation: ElementMutation;

	viewChildMap: { [name: string]: any } = {};

	constructor(public baiseView: HTMLComponent<T>) {
		this.componentRef = baiseView.getComponentRef();
		this.templateRegExp = (/\{\{((\w| |\.|\+|-|\*|\\)*(\(\))?)\}\}/g);
	}

	getPropertySource(viewProperty: string): PropertySource {
		let expression = parseHtmlExpression(viewProperty);
		let input = this.baiseView.getInputStartWith(viewProperty);
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
		if (Reflect.has(this.baiseView, parent)) {
			// parent = Reflect.get(this.baiseView, parent);
			// /**
			//  * case of element refrence
			//  * <root-app>
			//  * 	<app-tag #element-name ></app-tag>
			//  * </root-app>
			//  */
			// if (parent instanceof HTMLElement) {
			// 	return { property: modelProperty.substring(dotIndex + 1), src: parent, expression };
			// }
			return { property: modelProperty, src: this.baiseView, expression };
		}
		return { property: modelProperty, src: this.baiseView._model, expression };
	}

	initElementData(element: HTMLElement, elementAttr: string, viewProperty: string, isAttr: boolean) {
		const propertySrc = this.getPropertySource(viewProperty);
		if (isAttr) {
			updateAttribute(element, elementAttr, propertySrc.src, propertySrc.property);
		} else {
			updateValue(element, elementAttr, propertySrc.src, propertySrc.property);
		}
	}

	updateElementData(element: HTMLElement | Text | Object, elementAttr: string, propertySrc: PropertySource) {
		updateValue(element, elementAttr, propertySrc.src, propertySrc.property);
	}

	updateViewData(element: HTMLElement, elementAttr: string, propertySrc: PropertySource) {
		updateValue(propertySrc.src, propertySrc.property, element, elementAttr);
	}

	bind1Way(element: HTMLElement, elementAttr: string, viewProperty: string) {
		const propertySrc = this.getPropertySource(viewProperty);
		let callback1 = () => {
			this.updateElementData(element, elementAttr, propertySrc);
		};
		subscribe1way(propertySrc.src, propertySrc.property, element, elementAttr, callback1);
	}

	bind2Way(element: HTMLElement, elementAttr: string, viewProperty: string) {
		const propertySrc = this.getPropertySource(viewProperty);
		const callback2 = () => {
			this.updateViewData(element, elementAttr, propertySrc);
		};
		const callback1 = () => {
			this.updateElementData(element, elementAttr, propertySrc);
		};
		subscribe2way(propertySrc.src, propertySrc.property, element, elementAttr, callback1, callback2);

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
		// console.log('attrTemplateHandler', arguments, this);
		const result = [...viewProperty.matchAll(this.templateRegExp)];
		if (result.length === 0) {
			return;
		}
		const propSrcs: { [match: string]: PropertySource } = {};
		result.forEach(match => propSrcs[match[0]] = this.getPropertySource(match[1]));

		// console.log(result);
		// console.log(propSrcs);
		const handler = () => {
			let renderText = viewProperty;
			Object.keys(propSrcs).forEach(propTemplate => {
				const prop = propSrcs[propTemplate];
				let value = prop.expression.get(prop.src);
				renderText = renderText.replace(propTemplate, value);
				// let tempValue = getValueByPath(prop.src, prop.property);
				// if (typeof tempValue === 'function') {
				// 	// tempValue = tempValue.call(this.baiseView._model);
				// 	tempValue = tempValue.call(prop.src);
				// }
				// renderText = renderText.replace(propTemplate, tempValue);
			});
			if (isAttr && element instanceof HTMLElement) {
				element.setAttribute(elementAttr, renderText);
			} else {
				setValueByPath(element, elementAttr, renderText);
			}
		}
		let triggerTemplate: Function | undefined;
		Object.keys(propSrcs).forEach(propTemplate => {
			const prop = propSrcs[propTemplate];
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

	initView(): void {
		if (this.componentRef.template) {
			if (this.componentRef.template instanceof JsxAttrComponent) {
				this.template = this.componentRef.template;
			} else {
				this.template = jsxAttrComponentBuilder(this.componentRef.template(this.baiseView._model));
			}

			this.defineElementNameKey(this.template);

			this.componentRef.viewChild.forEach(view => {
				// support for string selector 
				let selctorName: string = view.selector as string;
				if (Reflect.has(this.viewChildMap, selctorName)) {
					Reflect.set(this.baiseView._model, view.modelName, this.viewChildMap[selctorName]);
				}
			});
			let rootRef: HTMLElement | ShadowRoot;
			if (this.componentRef.isShadowDom) {
				if (this.baiseView.shadowRoot /* OPEN MODE */) {
					rootRef = this.baiseView.shadowRoot;
				} else /* CLOSED MODE*/ {
					rootRef = Reflect.get(this.baiseView, '_shadowRoot') as ShadowRoot;
					Reflect.deleteProperty(this.baiseView, '_shadowRoot');
				}
			} else {
				rootRef = this.baiseView;
			}
			rootRef.appendChild(this.createElement(this.template));
		}
	}

	initHostListener(): void {
		this.componentRef.hostListeners?.forEach(
			listener => this.handelHostListener(listener)
		);
	}

	defineElementNameKey(component: JsxAttrComponent) {
		if (component.tagName === JsxFactory.Directive) {
			return;
		}
		let elName = component.attributes?.elementName;
		// console.log('viewChildMap', elName, component);
		if (elName) {
			const element = this.createElementByTagName(
				component.tagName,
				component.attributes?.is,
				component.attributes?.comment
			);
			Reflect.set(this.baiseView, elName, element);
			this.viewChildMap.elName = element;
		}
		if (component.children) {
			component.children
				.forEach(child => {
					if (typeof child === 'string') {
						return child;
					}
					else {
						return this.defineElementNameKey(child);
					}
				});
		}
	}

	getElementByName(name: string) {
		return Reflect.get(this.baiseView, name);
	}

	createElement(viewTemplate: JsxAttrComponent): HTMLElement | DocumentFragment | Comment {
		let element: HTMLElement | DocumentFragment | Comment;
		if (isJsxComponentWithElement(viewTemplate)) {
			element = viewTemplate.element
		}
		else if (JsxFactory.Directive === viewTemplate.tagName.toLowerCase() && viewTemplate.attributes?.directive) {
			let directiveName: string = viewTemplate.attributes.directive;
			let directiveValue = viewTemplate.attributes.directiveValue;
			let component = viewTemplate.attributes.comment;
			element = document.createComment(`${directiveName}=${directiveValue}`);
			const directiveRef = dependencyInjector
				.getInstance(ClassRegistry)
				.getDirectiveRef<T>(viewTemplate.attributes.directiveName);
			if (directiveRef) {

				if (directiveName.startsWith('*')) {
					// structural directive selector as '*if'
					// const directiveClass = directiveRef.modelClass as TypeOf<StructuralDirective<T>>;
					const directive = new directiveRef.modelClass(
						this,
						element,
						directiveValue,
						component);
					if (isOnInit(directive)) {
						directive.onInit();
					}

					Reflect.set(this.baiseView, viewTemplate.attributes.directiveName, directive);

				} else {
					// attributes directive selector as '[class]'
				}
			} else {
				// didn't fond directive or it not yet defined
			}
		}
		else {
			element = this.createElementByTagName(
				viewTemplate.tagName,
				viewTemplate.attributes?.is,
				viewTemplate.attributes?.comment
			);
		}

		if (element instanceof Comment) {
			return element;
		}

		if (viewTemplate.attributes && viewTemplate.tagName !== JsxFactory.Fragment) {
			this.initAttribute(<HTMLElement>element, viewTemplate.attributes);
		}
		if (viewTemplate.children && viewTemplate.children.length > 0) {
			for (const child of viewTemplate.children) {
				this.appendChild(element, child);
			}
		}
		return element;
	}

	// abstract initAttribute(element: HTMLElement, propertyKey: string, propertyValue: any): void;
	initAttribute(element: HTMLElement, attr: AttrDiscription): void {
		attr.property.forEach((attrValue, attrName) => {
			const isAttr = hasAttr(element, attrName);
			this.initElementData(element, attrName, attrValue, isAttr);
			this.bind2Way(element, attrName, attrValue);
		});
		attr.expression.forEach((attrValue, attrName) => {
			const isAttr = hasAttr(element, attrName);
			this.initElementData(element, attrName, attrValue, isAttr);
			this.bind1Way(element, attrName, attrValue);
			// console.log('expression', attrValue, attrName);

			// this.attrTemplateHandler(element, attrName, `{{${attrValue}}}`, isAttr);
		});
		attr.objects.forEach((attrValue, attrName) => {
			setValueByPath(element, attrName, attrValue);
		});
		attr.lessbinding.forEach((attrValue, attrName) => {
			const isAttr = hasAttr(element, attrName);
			this.initElementData(element, attrName, attrValue, isAttr);
		});
		attr.attr.forEach((attrValue, attrName) => {
			const isAttr = hasAttr(element, attrName);
			this.initElementData(element, attrName, attrValue as string, isAttr);

			if (attrValue === false) {
				element.removeAttribute(attrName);
			} else if (attrValue === true) {
				element.setAttribute(attrName, '');
			} else {
				element.setAttribute(attrName, attrValue);
			}
		});
		attr.template.forEach((attrValue, attrName) => {
			// const isAttr = hasAttr(element, attrName);
			// this.attrTemplateHandler(element, attrName, attrValue, isAttr);
		});
	}

	createElementByTagName(tagName: string, is?: string, comment?: string): HTMLElement | DocumentFragment | Comment {
		if (JsxFactory.Fragment === tagName.toLowerCase()) {
			return document.createDocumentFragment();
		}
		if ('comment' === tagName.toLowerCase()) {
			if (!comment) {
				comment = '//'
			}
			return document.createComment(comment);
		}

		let element: HTMLElement;
		if (tagName.includes('-')) {
			let ViewClass = customElements.get(tagName);
			if (ViewClass) {
				element = new ViewClass();
			}
			else {
				element = document.createElement(tagName);
				customElements.whenDefined(tagName).then(() => {
					customElements.upgrade(element);
					ViewClass = customElements.get(tagName);
					if (!(element instanceof ViewClass)) {
						const attrComponent = new JsxAttrComponent(tagName);
						const attributes = {};
						[].slice.call(element.attributes).forEach((attr: Attr) => {
							Reflect.set(attributes, attr.name, attr.value);
						});
						attrComponent.attributes = jsxComponentAttrHandler(attributes);

						const newChild = this.createElement(attrComponent);
						// const newChild = new ViewClass();
						// [].slice.call(element.attributes).forEach((attr: Attr) => {
						// 	newChild.setAttribute(attr.name, attr.value);
						// });
						// element.parentElement?.replaceChild(newChild, element);
						element.replaceWith(newChild);
					}
				});
			}
			// const registry: ClassRegistry = dependencyInjector.getInstance(ClassRegistry);
			// const componentRef = registry.getComponentRef<any>(tagName);

			// if (componentRef) {
			// 	if (componentRef.extend.classRef !== HTMLElement) {
			// 		element = document.createElement(componentRef.extend.name as string, { is: tagName });
			// 		// element.setAttribute('is', tagName);
			// 	} else {
			// 		element = new componentRef.viewClass();
			// 	}
			// } else {
			// 	element = document.createElement(tagName, { is: tagName });
			// }
		}
		else {
			// native tags // and custom tags can be used her
			element = document.createElement(tagName, is ? { is } : undefined);
		}
		if (isHTMLComponent(element)) {
			element.setParentComponent(this.baiseView);
		}
		return element;
	}

	appendChild(parent: Node, child: string | JsxAttrComponent) {
		if (child instanceof JsxAttrComponent) {
			parent.appendChild(this.createElement(child));
		} else {
			this.appendTextNode(parent, String(child));
		}
	}

	appendTextNode(parent: Node, child: string) {
		var node = document.createTextNode(child);
		parent.appendChild(node);
		this.attrTemplateHandler(node, 'textContent', child);
	}

	handelHostListener(listener: ListenerRef) {
		let eventName: string = listener.eventName,
			source: HTMLElement | Window,
			eventCallback: Function = this.baiseView._model[listener.modelCallbackName];
		if (listener.eventName.includes(':')) {
			const eventSource = eventName.substring(0, eventName.indexOf(':'));
			eventName = eventName.substring(eventName.indexOf(':') + 1);
			if ('window' === eventSource.toLowerCase()) {
				source = window;
				this.addNativeEventListener(source, eventName, eventCallback);
				return;
			} else if (eventSource in this.baiseView) {
				source = Reflect.get(this.baiseView, eventSource);
				if (!Reflect.has(source, '_model')) {
					this.addNativeEventListener(source, eventName, eventCallback);
					return;
				}
			} else {
				source = this.baiseView;
			}
		} else {
			source = this.baiseView;
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
		// else if (this.componentRef.encapsulation === 'template' && !this.baiseView.hasParentComponent()) {
		// 	this.addNativeEventListener(this.baiseView, eventName, eventCallback);
		// }
	}
	addNativeEventListener(source: HTMLElement | Window, eventName: string, funcallback: Function) {
		source.addEventListener(eventName, (event: Event) => {
			// funcallback(event);
			funcallback.call(this.baiseView._model, event);
		});
	}
}
