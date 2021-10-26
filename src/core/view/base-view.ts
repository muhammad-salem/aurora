import type { TypeOf } from '../utils/typeof.js';
import { createProxyForContext, ReactiveScope } from '@ibyar/expressions';
import {
	isAfterContentChecked, isAfterContentInit, isAfterViewChecked,
	isAfterViewInit, isDoCheck, isOnChanges, isOnDestroy, isOnInit
} from '../component/lifecycle.js';
import { ComponentRef, PropertyRef } from '../component/component.js';
import { BaseComponent, CustomElement, HTMLComponent, ModelType } from '../component/custom-element.js';
import { EventEmitter } from '../component/events.js';
import { defineModel, Model } from '../model/change-detection.js';
import { ComponentRender } from './render.js';
import { ElementModelReactiveScope } from '../component/provider.js';
import { ElementReactiveScope } from '../directive/providers.js';

const FACTORY_CACHE = new WeakMap<TypeOf<HTMLElement>, TypeOf<HTMLComponent<any>>>();

function defineInstancePropertyMap<T extends { [key: string]: any }>(instance: T) {
	if (typeof instance !== 'object') {
		return;
	}
	const prototype = Object.getPrototypeOf(instance);
	if (!prototype) {
		return;
	}
	const keys = Reflect.getMetadataKeys(prototype);
	keys
		.filter(key => !Reflect.has(instance, key))
		.forEach(key => Reflect.set(instance, key, undefined));
}

export function baseFactoryView<T extends Object>(htmlElementType: TypeOf<HTMLElement>): TypeOf<HTMLComponent<T>> {

	if (FACTORY_CACHE.has(htmlElementType)) {
		return FACTORY_CACHE.get(htmlElementType) as TypeOf<HTMLComponent<T>>;
	}
	class CustomView<T> extends htmlElementType implements BaseComponent<T>, CustomElement {
		_model: ModelType<T>;
		_proxyModel: ModelType<T>;
		_parentComponent: HTMLComponent<object>;
		_render: ComponentRender<T>;
		_shadowRoot: ShadowRoot;

		_componentRef: ComponentRef<T>;

		_modelScope: ReactiveScope<T & Model & { [key: string]: any; }>;
		_viewScope: ElementReactiveScope;

		constructor(componentRef: ComponentRef<T>, modelClass: TypeOf<T>) {
			super();
			this._componentRef = componentRef;
			if (componentRef.isShadowDom) {
				this._shadowRoot = this.attachShadow({
					mode: componentRef.shadowDomMode,
					delegatesFocus: componentRef.shadowDomDelegatesFocus
				});
			}
			const model = new modelClass(/* resolve dependency injection*/);
			defineInstancePropertyMap(model);
			this._model = defineModel(model);

			this._viewScope = new ElementReactiveScope(this);
			this._modelScope = ElementModelReactiveScope.blockScopeFor(this._model);
			this._proxyModel = createProxyForContext(this._model, this._modelScope);

			// if model had view decorator
			if (this._componentRef.view) {
				// this._model[componentRef.view] = this;
				Reflect.set(this._model, this._componentRef.view, this);
			}
			this._viewScope.subscribe((viewProperty, oldValue, newValue) => {
				this.setInputValue(viewProperty, newValue);
			});
			let source: any[] | undefined;
			this._modelScope.subscribe((modelProperty, oldValue, newValue) => {
				console.log('event name', modelProperty);
				if (oldValue == newValue) {
					return;
				}
				console.log('emit model', modelProperty, oldValue, newValue);
				// this.emitChanges(modelProperty as string);
				if (source) {
					source.push(modelProperty);
					this._model.emitChangeModel(modelProperty as string, source);
				} else {
					source = [modelProperty]
					this._model.emitChangeModel(modelProperty as string, source);
					source = undefined;
				}
			});
			this._render = new ComponentRender(this);
		}

		doBlockCallback = (): void => {
			if (isDoCheck(this._model)) {
				this._model.doCheck.call(this._proxyModel);
			}
		};

		getComponentRef(): ComponentRef<T> {
			return this._componentRef;
		}

		setParentComponent(parent: HTMLComponent<any>): void {
			this._parentComponent = parent;
		}

		getParentComponent(): HTMLComponent<any> {
			return this._parentComponent;
		}

		hasParentComponent(): boolean {
			return this._parentComponent ? true : false;
		}

		hasInputStartWith(viewProp: string): boolean {
			let dotIndex = viewProp.indexOf('.');
			if (dotIndex > 0) {
				viewProp = viewProp.substring(0, dotIndex);
			}
			return this.hasInput(viewProp);
		}

		getInputStartWith(viewProp: string): PropertyRef | undefined {
			let index = viewProp.indexOf('.');
			if (index > 0) {
				viewProp = viewProp.substring(0, index);
			}
			index = viewProp.indexOf('[');
			if (index > 0) {
				viewProp = viewProp.substring(0, index);
			}
			return this.getInput(viewProp);
		}

		hasInput(viewProp: string): boolean {
			return this._componentRef.inputs.some(input => input.viewAttribute === viewProp);
		}

		getInput(viewProp: string): PropertyRef | undefined {
			return this._componentRef.inputs.find(input => input.viewAttribute === viewProp);
		}

		getInputValue(viewProp: string): any {
			const inputRef = this.getInput(viewProp);
			if (inputRef) {
				return this._model[inputRef.modelProperty];
			}
		}

		setInputValue(viewProp: PropertyKey, value: any): void {
			const inputRef = this.getInput(viewProp as string);
			if (inputRef) {
				// console.log('about to change input', inputRef.modelProperty, value);
				// Reflect.set(this._model, inputRef.modelProperty, value);
				// this._model.emitChangeModel(inputRef.modelProperty);
				this._modelScope.set(inputRef.modelProperty, value);
			}
		}

		hasOutput(viewProp: string): boolean {
			return this._componentRef.outputs.some(output => output.viewAttribute === viewProp);
		}

		getOutput(viewProp: string): PropertyRef | undefined {
			return this._componentRef.outputs.find(output => output.viewAttribute === viewProp);
		}

		getEventEmitter<V>(viewProp: string): EventEmitter<V> | undefined {
			const outputRef = this.getOutput(viewProp);
			if (outputRef) {
				return this._model[outputRef.modelProperty] as EventEmitter<V>;
			}
		}

		hasProp(propName: string): boolean {
			return Reflect.has(this._model, propName);
		}

		private setAttributeHelper(attrViewName: string, value: any): void {
			if (value === null || value === undefined) {
				this.removeAttribute(attrViewName);
			}
			else if (typeof value === 'boolean') {
				if (value) {
					super.setAttribute(attrViewName, '');
				} else {
					this.removeAttribute(attrViewName);
				}
			} else {
				super.setAttribute(attrViewName, value);
			}
		}

		setAttribute(attrViewName: string, value: any): void {
			this.setInputValue(attrViewName, value);
			this.setAttributeHelper(attrViewName, value);
		}

		getAttribute(attrViewName: string): string | null {
			return this.getInputValue(attrViewName) ?? super.getAttribute(attrViewName);
		}

		attributeChangedCallback(name: string, oldValue: string, newValue: string) {
			if (newValue === oldValue) {
				return;
			}
			// this._changeObservable.emit(name);
			const inputRef = this.getInput(name);
			if (inputRef) {
				this._model.emitChangeModel(inputRef.modelProperty);
			}
			if (isOnChanges(this._model)) {
				this._model.onChanges.call(this._proxyModel);
			}
			this.doBlockCallback();
		}

		connectedCallback() {

			this._componentRef.inputs.forEach(input => {
				const inputDefaultValue = this._model[input.modelProperty];
				if (inputDefaultValue !== null && inputDefaultValue !== undefined) {
					this.setAttributeHelper(input.viewAttribute, inputDefaultValue);
				}
			});

			// if (!this.hasParentComponent() && this.attributes.length > 0) {
			// 	let oldAttrValues = Array.prototype.slice.call(this.attributes);
			//	oldAttrValues.forEach((attr: Attr) => {
			// 		Reflect.set(this, attr.name, attr.value);
			// 	});
			// }

			if (!this.hasParentComponent() && this.attributes.length > 0) {
				let attrs: Attr[] = Array.prototype.slice.call(this.attributes);
				attrs.forEach(attr => this.initOuterAttribute(attr));
			}

			if (isOnChanges(this._model)) {
				this._model.onChanges.call(this._proxyModel);
			}
			if (isOnInit(this._model)) {
				this._model.onInit.call(this._proxyModel);
			}
			if (isDoCheck(this._model)) {
				this._model.doCheck.call(this._proxyModel);
			}
			if (isAfterContentInit(this._model)) {
				this._model.afterContentInit.call(this._proxyModel);
			}
			if (isAfterContentChecked(this._model)) {
				this._model.afterContentChecked.call(this._proxyModel);
			}

			// if (!this.hasParentComponent()) {
			// 	Array.prototype.slice.call(this.attributes).forEach((attr: Attr) => {
			// 		this.initOuterAttribute(attr);
			// 	});
			// }

			// do once
			if (this.childNodes.length === 0) {
				// setup ui view
				this._render.initView();

				// init Host Listener events
				this._render.initHostListener();
			}

			if (isAfterViewInit(this._model)) {
				this._model.afterViewInit.call(this._proxyModel);
			}
			if (isAfterViewChecked(this._model)) {
				this._model.afterViewChecked.call(this._proxyModel);
			}
			this.doBlockCallback = () => {
				if (isDoCheck(this._model)) {
					this._model.doCheck.call(this._proxyModel);
				}
				if (isAfterContentChecked(this._model)) {
					this._model.afterContentChecked.call(this._proxyModel);
				}
				if (isAfterViewChecked(this._model)) {
					this._model.afterViewChecked.call(this._proxyModel);
				}
				this.emitRootChanges();
			};
			this.emitRootChanges();
		}

		emitRootChanges(): void {
			this.emitChanges(...Object.keys(this._model.__observable).filter(event => event !== 'destroy'));
		}

		emitChanges(...events: string[]): void {
			const sources: any[] = [];
			events.forEach(key => {
				this._model.emitChangeModel(key, sources);
			});
		}

		initOuterAttribute(attr: Attr) {
			// [window, this] scop
			let elementAttr = attr.name;
			let modelProperty = attr.value;
			if (elementAttr.startsWith('[')) {
				elementAttr = elementAttr.substring(1, elementAttr.length - 1);
				if (Reflect.has(window, modelProperty)) {
					this.setInputValue(elementAttr, Reflect.get(window, modelProperty));
				}
				//   else {
				// 	let value: any;
				// 	Object.defineProperty(window, modelProperty, {
				// 		set: (v: any) => {
				// 			value = v;
				// 			if (this) {
				// 				this.setInputValue(elementAttr, v);
				// 				// fake connect element
				// 				this.connectedCallback();
				// 			}
				// 		},
				// 		get: (): any => value
				// 	});
				// }

			}
			else if (elementAttr.startsWith('(')) {
				// (elementAttr)="modelProperty()"
				elementAttr = elementAttr.substring(1, elementAttr.length - 1);
				// this.handleEvent(element, elementAttr, viewProperty);
				modelProperty = modelProperty.endsWith('()') ?
					modelProperty.substring(0, modelProperty.length - 2) : modelProperty;
				let callback: Function = Reflect.get(window, modelProperty);
				this.addEventListener(elementAttr, event => {
					callback(event);
				});
			} else if (elementAttr.startsWith('on')) {
				const modelEvent = this.getEventEmitter<any>(elementAttr.substring(2));
				if (modelEvent) {
					// modelEvent.subscribe(listener);
					modelProperty = modelProperty.endsWith('()') ?
						modelProperty.substring(0, modelProperty.length - 2) : modelProperty;
					let listener: Function = Reflect.get(window, modelProperty);
					modelEvent.subscribe((data: any) => {
						(listener as Function)(data);
					});
				}
			} else {
				this.setInputValue(attr.name, attr.value);
			}
		}

		adoptedCallback() {
			// restart the process
			this.innerHTML = '';
			this.connectedCallback();
		}
		disconnectedCallback() {
			// notify first, then call model.onDestroy func
			// this._changeObservable.emit('destroy');
			if (isOnDestroy(this._model)) {
				this._model.onDestroy.call(this._proxyModel);
			}
			this.emitChanges('destroy');
		}

		// events api
		addEventListener(eventName: string, listener: EventListenerOrEventListenerObject | null, options?: boolean | AddEventListenerOptions): void {
			if ('on' + eventName in this) {
				super.addEventListener(eventName, (event: Event) => {
					(listener as Function)(event);
				}, options);
				return;
			}
			const modelOutput = this.getEventEmitter<any>(eventName);
			if (modelOutput) {
				// modelOutput.subscribe(listener);
				modelOutput.subscribe((data: any) => {
					(listener as Function)(data);
				});
			}
			else {
				this._model.subscribeModel(eventName, listener as () => void);
			}
		}

		triggerOutput(eventName: string, value?: any): void {
			const modelEvent = this.getEventEmitter<any>(eventName);
			if (modelEvent) {
				modelEvent.emit(value);
				return;
			}
		}

		triggerModelChange(eventName: string, value?: any): void {
			// this._changeObservable.emit(eventName, value);
			this._model.emitChangeModel(eventName);
		}
	};
	FACTORY_CACHE.set(htmlElementType, CustomView);
	return CustomView;
}

// const CustomViewTypes: WeakMap<TypeOf<HTMLElement>, TypeOf<HTMLComponent<any>>> = new WeakMap();
// function createViewClass(elementType: TypeOf<HTMLElement>, isForm: boolean) {
//     if (isForm) {
//         let ViewClass = baseFormFactoryView(elementType);
//         CustomViewTypes.set(elementType, ViewClass);
//         return ViewClass;
//     }
//     else {
//         let ViewClass = baseFactoryView(elementType);
//         CustomViewTypes.set(elementType, ViewClass);
//         return ViewClass;
//     }
// }

// export function getBaseViewClassByHTMLElementType(elementType?: TypeOf<HTMLElement>, isFormAssociated?: boolean) {
//     if (elementType && CustomViewTypes.has(elementType)) {
//         return CustomViewTypes.get(elementType);
//     }
//     // start to created view class
//     else if (!elementType || elementType === HTMLElement) {
//             return createViewClass(HTMLElement, isFormAssociated || false);
//         }
//     if (CustomViewTypes.has(elementType)) {
//         return CustomViewTypes.get(elementType);
//     } else {

//     }
// }
