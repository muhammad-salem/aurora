import type { Type } from '../utils/typeof.js';
import {
	ReactiveScope, ReactiveControlScope, Context,
	ScopeSubscription, SignalScope, isReactive
} from '@ibyar/expressions';
import {
	isAfterContentChecked, isAfterContentInit, isAfterViewChecked,
	isAfterViewInit, isDoCheck, isOnChanges, isOnDestroy, isOnInit
} from '../component/lifecycle.js';
import { ComponentRef } from '../component/component.js';
import { BaseComponent, CustomElement, HTMLComponent, ModelType } from '../component/custom-element.js';
import { EventEmitter } from '../component/events.js';
import { ComponentRender } from './render.js';
import { getRootZone } from '../zone/bootstrap.js';
import { AbstractAuroraZone, AuroraZone, ProxyAuroraZone } from '../zone/zone.js';
import { ChangeDetectorRef, createModelChangeDetectorRef } from '../linker/change-detector-ref.js';
import { createProxyZone } from '../zone/proxy.js';
import { PropertyRef } from '../component/reflect.js';
import { clearSignalScope, pushNewSignalScope } from '../signals/signals.js';
import { forkProvider, addProvider, removeProvider } from '../di/inject.js';
import { isOutputSignal, VIEW_TOKEN } from '../component/initializer.js';
import { InjectionProvider } from '../di/provider.js';

export function baseFactoryView<T extends object>(htmlElementType: Type<HTMLElement>): Type<HTMLComponent<T>> {
	return class CustomView extends htmlElementType implements BaseComponent<T>, CustomElement {
		_model: ModelType<T>;
		_signalScope: SignalScope;
		_render: ComponentRender<T>;
		_shadowRoot: ShadowRoot;

		_componentRef: ComponentRef<T>;

		_modelScope: ReactiveControlScope<T>;
		_viewScope: ReactiveScope<{ 'this': BaseComponent<T> }>;
		_zone: AuroraZone;
		_provider: InjectionProvider;
		_detector: ChangeDetectorRef;

		private subscriptions: ScopeSubscription<Context>[] = [];
		private onDestroyCalls: (() => void)[] = [];
		private needRendering = true;

		constructor(componentRef: ComponentRef<T>, modelClass: Type<T>) {
			super();
			this._componentRef = componentRef;
			if (componentRef.isShadowDom && !componentRef.disabledFeatures?.includes('shadow')) {
				this._shadowRoot = this.attachShadow(componentRef.shadowRootInit);
			}

			this._signalScope = pushNewSignalScope();
			this._provider = forkProvider();


			/* resolve dependency injection*/
			this._detector = createModelChangeDetectorRef(() => this._modelScope);
			this._zone = getRootZone().fork(componentRef.zone);

			this._provider.setType(AbstractAuroraZone, this._zone);
			this._provider.setType(ChangeDetectorRef, this._detector);
			this._provider.setToken(VIEW_TOKEN, this);
			addProvider(this._provider);
			const model = new modelClass();
			removeProvider(this._provider);
			this._model = model;

			clearSignalScope(this._signalScope);
			const modelScope = ReactiveControlScope.for(model);
			const modelProxyRef = this._zone instanceof ProxyAuroraZone
				? createProxyZone(model, this._zone)
				: model;
			modelScope.getContextProxy = () => modelProxyRef;
			this._modelScope = modelScope;

			Object.keys(this._model).forEach(key => {
				const node = this._model[key];
				if (isReactive(node)) {
					node.subscribe((value, old) => this._modelScope.emit(key as any, value, old));
				}
			});

			this._viewScope = ReactiveScope.for<{ 'this': BaseComponent<T> }>({ 'this': this });
			const elementScope = this._viewScope.getInnerScope<ReactiveScope<BaseComponent<T>>>('this')!;
			componentRef.inputs.forEach(input => {
				elementScope.subscribe(input.viewAttribute as any, (newValue, oldValue) => {
					if (newValue === oldValue) {
						return;
					}
					this._render.modelStack.set(input.modelProperty, newValue);
				});
				this._modelScope.subscribe(input.modelProperty as any, (newValue, oldValue) => {
					if (newValue === oldValue) {
						return;
					}
					elementScope.emit(input.viewAttribute as any, newValue, oldValue);
				});
			});

			componentRef.outputs.forEach(output => {
				const event = model[output.modelProperty as keyof T];
				if (event instanceof EventEmitter || isOutputSignal(event)) {
					const options = isOutputSignal(event) ? event.options : output.options;
					event.subscribe((value: any) => {
						const event = new CustomEvent(
							output.viewAttribute,
							{
								detail: value,
								cancelable: false,
								bubbles: options?.bubbles,
								composed: options?.bubbles,
							},
						);
						this.dispatchEvent(event);
					})
				}
			});
			// if property of the model has view decorator
			if (this._componentRef.view) {
				Reflect.set(this._model, this._componentRef.view, this);
			}

			this._render = new ComponentRender(this, this.subscriptions);

			if (this.attributes.length > 0) {
				let attrs: Attr[] = Array.prototype.slice.call(this.attributes);
				attrs.forEach(attr => this.initOuterAttribute(attr));
			}

			if (this._componentRef.encapsulation === 'shadow-slot') {
				// render view before inserting any slot element as child
				this.initView();
			}
		}

		doBlockCallback = (): void => {
			if (isDoCheck(this._model)) {
				this._zone.run(this._model.doCheck, this._modelScope.getContextProxy!());
			}
		};

		getComponentRef(): ComponentRef<T> {
			return this._componentRef;
		}

		getInput(viewProp: string): PropertyRef | undefined {
			return this._componentRef.inputs.find(input => input.viewAttribute === viewProp);
		}

		getInputValue(viewProp: string): any {
			const inputRef = this.getInput(viewProp);
			if (inputRef) {
				return this._render.modelStack.get(inputRef.modelProperty);
			}
		}

		setInputValue(viewProp: PropertyKey, value: any): void {
			const inputRef = this.getInput(viewProp as string);
			if (inputRef) {
				this._render.modelStack.set(inputRef.modelProperty, value);
			}
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

		private initView() {
			// setup ui view
			this._render.initView();

			// init view binding
			this._render.initViewBinding();
			this.needRendering = false;
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
			if (this.needRendering) {
				this.initView();
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
			const event = new CustomEvent('connected', { cancelable: true, bubbles: false, composed: false });
			this.dispatchEvent(event);
		}

		private initOuterAttribute(attr: Attr) {
			// [window, this] scope
			let elementAttr = attr.name;
			let modelProperty = attr.value;
			if (elementAttr.startsWith('[')) {
				elementAttr = elementAttr.substring(1, elementAttr.length - 1);
				if (Reflect.has(window, modelProperty)) {
					this.setInputValue(elementAttr, Reflect.get(window, modelProperty));
				}
			} else if ((elementAttr.startsWith('(') && elementAttr.endsWith(')')) || elementAttr.startsWith('@') || elementAttr.startsWith('on')) {
				// (elementAttr)="modelProperty()"
				// @elementAttr="modelProperty()"
				// onElementAttr="modelProperty()"
				// lower-case-event-name = "modelProperty()"

				let start = 0, end: number | undefined = undefined;
				if (elementAttr.startsWith('(') || elementAttr.startsWith('@')) {
					start = 1;
				} else if (elementAttr.startsWith('on')) {
					start = 2;
				}
				if (elementAttr.endsWith(')')) {
					end = elementAttr.length - 1;
				}
				const eventName = elementAttr.substring(start, end)?.replaceAll('-', '').toLowerCase();
				if (modelProperty.endsWith('()')) {
					modelProperty = modelProperty.substring(0, modelProperty.length - 2);
				}
				const callback: Function = Reflect.get(window, modelProperty);
				const customEvent = this._componentRef.outputs.find(output => output.viewAttribute.toLowerCase() === eventName);
				if (customEvent) {
					this._modelScope.subscribe(customEvent.modelProperty as keyof T, (data: any) => (callback as Function)?.(data));
				} else {
					this.addEventListener(elementAttr, event => callback?.(event));
				}

			} else {
				const inputRef = this.getInput(attr.name);
				if (inputRef) {
					this._render.modelStack.set(inputRef.modelProperty, attr.value);
				}
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
			const event = new CustomEvent('disconnected', { cancelable: true, bubbles: false, composed: false });
			this.dispatchEvent(event);
		}

	};

}
