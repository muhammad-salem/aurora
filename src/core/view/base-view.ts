import type { TypeOf } from '../utils/typeof.js';
import { ReactiveScope } from '@ibyar/expressions';
import {
	isAfterContentChecked, isAfterContentInit, isAfterViewChecked,
	isAfterViewInit, isDoCheck, isOnChanges, isOnDestroy, isOnInit
} from '../component/lifecycle.js';
import { ComponentRef, PropertyRef } from '../component/component.js';
import { BaseComponent, CustomElement, HTMLComponent } from '../component/custom-element.js';
import { EventEmitter } from '../component/events.js';
import { defineModel, Model } from '../model/change-detection.js';
import { ComponentRender } from './render.js';

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
		_model: T & Model & { [key: string]: any; };
		_parentComponent: HTMLComponent<object>;
		_render: ComponentRender<T>;
		_shadowRoot: ShadowRoot;

		_setAttributeNative: Function;
		_getAttributeNative: Function;
		_addEventListenerNative: Function;

		_componentRef: ComponentRef<T>;

		_modelScope: ReactiveScope<T & Model & { [key: string]: any; }>;
		_viewScope: ReactiveScope<CustomView<T>>;

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

			this._modelScope = ReactiveScope.blockScopeFor(this._model);
			this._viewScope = ReactiveScope.blockScopeFor(this);

			// if model had view decorator
			if (this._componentRef.view) {
				// this._model[componentRef.view] = this;
				Reflect.set(this._model, this._componentRef.view, this);
			}

			this._setAttributeNative = this.setAttribute;
			this._getAttributeNative = this.getAttribute;
			this._addEventListenerNative = this.addEventListener;

			this.setAttribute = this._setAttribute;
			this.getAttribute = this._getAttribute;
			this.addEventListener = this._addEventListener;

			this._render = new ComponentRender(this);
		}

		doBlockCallback = (): void => {
			if (isDoCheck(this._model)) {
				this._model.doCheck();
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

		setInputValue(viewProp: string, value: any): void {
			const inputRef = this.getInput(viewProp);
			if (inputRef) {
				// console.log('about to change input', inputRef.modelProperty, value);
				Reflect.set(this._model, inputRef.modelProperty, value);
				// this._changeObservable.emit(viewProp);
				this._model.emitChangeModel(inputRef.modelProperty);
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

		_setAttributeHelper(attrViewName: string, value: any): void {
			if (value === null || value === undefined) {
				return;
			}
			if (typeof value === 'boolean') {
				if (value) {
					this._setAttributeNative(attrViewName, '');
				} else {
					this.removeAttribute(attrViewName);
				}
			} else {
				this._setAttributeNative(attrViewName, String(value));
			}
		}

		_setAttribute(attrViewName: string, value: any): void {
			if (value === null || value === undefined) {
				return;
			}
			this.setInputValue(attrViewName, value);
			this._setAttributeHelper(attrViewName, value);
		}

		_getAttribute(attrViewName: string): string | null {
			return this.getInputValue(attrViewName);
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
				this._model.onChanges();
			}
			this.doBlockCallback();
		}

		connectedCallback() {

			this._componentRef.inputs.forEach(input => {
				const inputDefaultValue = this._model[input.modelProperty];
				if (inputDefaultValue !== null && inputDefaultValue !== undefined) {
					this._setAttributeHelper(input.viewAttribute, inputDefaultValue);
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
				this._model.onChanges();
			}
			if (isOnInit(this._model)) {
				this._model.onInit();
			}
			if (isDoCheck(this._model)) {
				this._model.doCheck();
			}
			if (isAfterContentInit(this._model)) {
				this._model.afterContentInit();
			}
			if (isAfterContentChecked(this._model)) {
				this._model.afterContentChecked();
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
				this._model.afterViewInit();
			}
			if (isAfterViewChecked(this._model)) {
				this._model.afterViewChecked();
			}
			this.doBlockCallback = () => {
				if (isDoCheck(this._model)) {
					this._model.doCheck();
				}
				if (isAfterContentChecked(this._model)) {
					this._model.afterContentChecked();
				}
				if (isAfterViewChecked(this._model)) {
					this._model.afterViewChecked();
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
				this._model.onDestroy();
			}
			this.emitChanges('destroy');
		}

		// events api
		_addEventListener(eventName: string, listener: EventListenerOrEventListenerObject | null, options?: boolean | AddEventListenerOptions): void {
			if ('on' + eventName in this) {
				this._addEventListenerNative(eventName, (event: Event) => {
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
