import type { TypeOf } from '../utils/typeof.js';
import { ReactiveScope, ReactiveScopeControl, Context, ScopeSubscription } from '@ibyar/expressions';
import {
	isAfterContentChecked, isAfterContentInit, isAfterViewChecked,
	isAfterViewInit, isDoCheck, isOnChanges, isOnDestroy, isOnInit
} from '../component/lifecycle.js';
import { ComponentRef } from '../component/component.js';
import { BaseComponent, CustomElement, HTMLComponent, ModelType } from '../component/custom-element.js';
import { EventEmitter } from '../component/events.js';
import { ComponentRender } from './render.js';
import { getCurrentZone } from '../zone/bootstrap.js';
import { AuroraZone, ProxyAuroraZone } from '../zone/zone.js';
import { createModelChangeDetectorRef } from '../linker/change-detector-ref.js';
import { createProxyZone } from '../zone/proxy.js';
import { PropertyRef } from '../component/reflect.js';

const FACTORY_CACHE = new WeakMap<TypeOf<HTMLElement>, TypeOf<HTMLComponent<any>>>();

export function baseFactoryView<T extends object>(htmlElementType: TypeOf<HTMLElement>): TypeOf<HTMLComponent<T>> {

	if (FACTORY_CACHE.has(htmlElementType)) {
		return FACTORY_CACHE.get(htmlElementType) as TypeOf<HTMLComponent<T>>;
	}
	class CustomView extends htmlElementType implements BaseComponent<T>, CustomElement {
		_model: ModelType<T>;
		_parentComponent: HTMLComponent<object>;
		_render: ComponentRender<T>;
		_shadowRoot: ShadowRoot;

		_componentRef: ComponentRef<T>;

		_modelScope: ReactiveScopeControl<T>;
		_viewScope: ReactiveScope<{ 'this': BaseComponent<T> }>;
		_zone: AuroraZone;

		private subscriptions: ScopeSubscription<Context>[] = [];
		private onDestroyCalls: (() => void)[] = [];

		constructor(componentRef: ComponentRef<T>, modelClass: TypeOf<T>) {
			super();
			this._componentRef = componentRef;
			if (componentRef.isShadowDom) {
				this._shadowRoot = this.attachShadow({
					mode: componentRef.shadowDomMode,
					delegatesFocus: componentRef.shadowDomDelegatesFocus
				});
			}
			const args = []; /* resolve dependency injection*/
			const detector = createModelChangeDetectorRef(() => this._modelScope);
			args.push(detector)
			this._zone = getCurrentZone(componentRef.zone).fork();
			args.push(this._zone);
			const model = new modelClass(...args);
			this._model = model;

			const modelScope = ReactiveScopeControl.for(model);
			const modelProxyRef = this._zone instanceof ProxyAuroraZone
				? createProxyZone(model, this._zone)
				: model;
			modelScope.getContextProxy = () => modelProxyRef;
			this._modelScope = modelScope;

			this._viewScope = ReactiveScope.for<{ 'this': BaseComponent<T> }>({ 'this': this });
			const elementScope = this._viewScope.getInnerScope<ReactiveScope<BaseComponent<T>>>('this')!;
			componentRef.inputs.forEach(input => {
				elementScope.subscribe(input.viewAttribute as any, (newValue, oldValue) => {
					if (newValue === oldValue) {
						return;
					}
					this._modelScope.set(input.modelProperty as any, newValue);
				});
				this._modelScope.subscribe(input.modelProperty as any, (newValue, oldValue) => {
					if (newValue === oldValue) {
						return;
					}
					elementScope.emit(input.viewAttribute as any, newValue, oldValue);
				});
			});

			componentRef.outputs.forEach(output =>
				(model[output.modelProperty as keyof T] as any as EventEmitter<any>)
					.subscribe((value: any) => {
						const event = new CustomEvent(
							output.viewAttribute,
							{
								detail: value,
								cancelable: false,
								bubbles: output.options?.bubbles,
								composed: output.options?.bubbles,
							},
						);
						this.dispatchEvent(event);
					})
			);
			// if property of the model has view decorator
			if (this._componentRef.view) {
				Reflect.set(this._model, this._componentRef.view, this);
			}
			this._render = new ComponentRender(this, this.subscriptions);
		}

		detectChanges(): void {
			this._modelScope.detectChanges();
		}

		doBlockCallback = (): void => {
			if (isDoCheck(this._model)) {
				this._zone.run(this._model.doCheck, this._modelScope.getContextProxy!());
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
				this._modelScope.set(inputRef.modelProperty as never, value);
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
			return;
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
			if (isOnChanges(this._model)) {
				this._zone.run(this._model.onChanges, this._modelScope.getContextProxy!());
			}
			this.doBlockCallback();
		}

		connectedCallback() {
			if (this.subscriptions.length) {
				this.subscriptions.forEach(sub => sub.unsubscribe());
			}
			this.subscriptions.splice(0, this.subscriptions.length);
			const cds = this._zone.onEmpty.subscribe(() => this._modelScope.detectChanges());
			this.onDestroy(() => cds.unsubscribe());
			this._componentRef.inputs.forEach(input => {
				const inputDefaultValue = this._model[input.modelProperty];
				if (inputDefaultValue !== null && inputDefaultValue !== undefined) {
					this.setAttributeHelper(input.viewAttribute, inputDefaultValue);
				}
			});

			if (!this.hasParentComponent() && this.attributes.length > 0) {
				let attrs: Attr[] = Array.prototype.slice.call(this.attributes);
				attrs.forEach(attr => this.initOuterAttribute(attr));
			}

			if (isOnChanges(this._model)) {
				this._zone.run(this._model.onChanges, this._modelScope.getContextProxy!());
			}
			if (isOnInit(this._model)) {
				this._zone.run(this._model.onInit, this._modelScope.getContextProxy!());
			}
			if (isDoCheck(this._model)) {
				this._zone.run(this._model.doCheck, this._modelScope.getContextProxy!());
			}
			if (isAfterContentInit(this._model)) {
				this._zone.run(this._model.afterContentInit, this._modelScope.getContextProxy!());
			}
			if (isAfterContentChecked(this._model)) {
				this._zone.run(this._model.afterContentChecked, this._modelScope.getContextProxy!());
			}

			// do once
			if (this.childNodes.length === 0) {
				// setup ui view
				this._render.initView();

				// init Host Listener events
				this._render.initHostListener();
			}

			if (isAfterViewInit(this._model)) {
				this._zone.run(this._model.afterViewInit, this._modelScope.getContextProxy!());
			}
			if (isAfterViewChecked(this._model)) {
				this._zone.run(this._model.afterViewChecked, this._modelScope.getContextProxy!());
			}
			this.doBlockCallback = () => {
				if (isDoCheck(this._model)) {
					this._zone.run(this._model.doCheck, this._modelScope.getContextProxy!());
				}
				if (isAfterContentChecked(this._model)) {
					this._zone.run(this._model.afterContentChecked, this._modelScope.getContextProxy!());
				}
				if (isAfterViewChecked(this._model)) {
					this._zone.run(this._model.afterViewChecked, this._modelScope.getContextProxy!());
				}
			};
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
		onDestroy(callback: () => void) {
			this.onDestroyCalls.push(callback);
		}
		adoptedCallback() {
			// restart the process
			this.innerHTML = '';
			this.connectedCallback();
		}
		disconnectedCallback() {
			// notify first, then call model.onDestroy func
			if (isOnDestroy(this._model)) {
				this._zone.run(this._model.onDestroy, this._modelScope.getContextProxy!());
			}
			this.subscriptions.forEach(sub => sub.unsubscribe());
			this.subscriptions.splice(0, this.subscriptions.length);
			this.onDestroyCalls.forEach(callback => {
				try {
					callback();
				} catch (error) {
					console.error(error);
				}
			});
			this.onDestroyCalls.splice(0, this.onDestroyCalls.length);
		}

		triggerOutput(eventName: string, value?: any): void {
			const modelEvent = this.getEventEmitter<any>(eventName);
			if (modelEvent) {
				modelEvent.emit(value);
				return;
			}
		}
	};
	FACTORY_CACHE.set(htmlElementType, CustomView);
	return CustomView;
}
