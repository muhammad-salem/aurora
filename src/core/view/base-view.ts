import type { TypeOf } from '../utils/typeof.js';
import {
	ReactiveScope, ReactiveScopeControl, Context,
	ScopeSubscription, SignalScope, getReactiveNode, isReactive
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
import { AuroraZone, ProxyAuroraZone } from '../zone/zone.js';
import { createModelChangeDetectorRef } from '../linker/change-detector-ref.js';
import { createProxyZone } from '../zone/proxy.js';
import { PropertyRef } from '../component/reflect.js';
import { clearSignalScope, setSignalScope } from '../signals/signals.js';
import { Signal } from 'signal-polyfill';
import { setupScopesForSignal } from '../signals/proposal-signals.js';

export function baseFactoryView<T extends object>(htmlElementType: TypeOf<HTMLElement>): TypeOf<HTMLComponent<T>> {
	return class CustomView extends htmlElementType implements BaseComponent<T>, CustomElement {
		_model: ModelType<T>;
		_signalScope: SignalScope;
		_render: ComponentRender<T>;
		_shadowRoot: ShadowRoot;

		_componentRef: ComponentRef<T>;

		_modelScope: ReactiveScopeControl<T>;
		_viewScope: ReactiveScope<{ 'this': BaseComponent<T> }>;
		_zone: AuroraZone;

		private subscriptions: ScopeSubscription<Context>[] = [];
		private onDestroyCalls: (() => void)[] = [];
		private needRendering = true;

		constructor(componentRef: ComponentRef<T>, modelClass: TypeOf<T>) {
			super();
			this._componentRef = componentRef;
			if (componentRef.isShadowDom) {
				this._shadowRoot = this.attachShadow(componentRef.shadowRootInit);
			}

			this._signalScope = new SignalScope();
			setSignalScope(this._signalScope);

			const args = []; /* resolve dependency injection*/
			const detector = createModelChangeDetectorRef(() => this._modelScope);
			args.push(detector)
			this._zone = getRootZone().fork(componentRef.zone);
			args.push(this._zone);
			const model = new modelClass(...args);
			this._model = model;

			clearSignalScope();


			const modelScope = ReactiveScopeControl.for(model);
			const modelProxyRef = this._zone instanceof ProxyAuroraZone
				? createProxyZone(model, this._zone)
				: model;
			modelScope.getContextProxy = () => modelProxyRef;
			this._modelScope = modelScope;

			const keys = Object.keys(model);
			keys.filter(key => isReactive(this._model[key]))
				.forEach(key => getReactiveNode(this._model[key])!.subscribe((value, old) => this._modelScope.emit(key as any, value, old)));

			keys.filter(key => {
				const signal = this._model[key];
				return signal instanceof Signal.State || signal instanceof Signal.Computed;
			}).forEach(key => {
				queueMicrotask(() => setupScopesForSignal(this._model[key], this._modelScope, key));
			});

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

			if (this.attributes.length > 0) {
				let attrs: Attr[] = Array.prototype.slice.call(this.attributes);
				attrs.forEach(attr => this.initOuterAttribute(attr));
			}

			if (this._componentRef.encapsulation === 'shadow-slot') {
				// render view before inserting any slot element as child
				this.initView();
			}
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
			const event = new CustomEvent('disconnected', { cancelable: true, bubbles: false, composed: false });
			this.dispatchEvent(event);
		}

		triggerOutput(eventName: string, value?: any): void {
			const modelEvent = this.getEventEmitter<any>(eventName);
			if (modelEvent) {
				modelEvent.emit(value);
				return;
			}
		}
	};
}
