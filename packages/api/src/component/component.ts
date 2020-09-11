
import { JsxAttrComponent, JSXRender, TypeOf } from '@aurorats/types';
import { findByModelClassOrCreat, setBootstrapTagNameMatadata } from '@aurorats/metadata';
import { findByTagName, Tag } from '@aurorats/element';
import { htmlTemplateToJSXRender } from '@aurorats/html-parser';

import { HTMLComponent } from './custom-element.js';
import { dependencyInjector } from '../providers/injector.js';
import { ClassRegistry } from '../providers/provider.js';
import { toJsxAttrComponent } from '../parser/html-template-parser.js';
import { StructuralDirective } from '../directive/directive.js';
import { initCustomElementView } from '../view/view.js';
import {
	ComponentOptions, ChildOptions, PipeOptions,
	ServiceOptions, DirectiveOptions
} from '../annotation/decorators.js';

export class PropertyRef {
	constructor(public modelProperty: string, private _viewNanme?: string) { }
	get viewAttribute(): string {
		return this._viewNanme || this.modelProperty;
	}
}

export class ChildRef {
	constructor(public modelName: string, public selector: string | { new(): HTMLElement; prototype: HTMLElement } | CustomElementConstructor, public childOptions?: ChildOptions) { }
}

export class ListenerRef {
	constructor(public eventName: string, public args: string[], public modelCallbackName: string) { }
}

export class HostBindingRef {
	constructor(public viewProperty: string, public hostPropertyName: string) { }
}

export interface BootstropMatadata {
	[key: string]: any;
}

export interface ServiceRef<T> {
	provideIn: TypeOf<CustomElementConstructor> | 'root' | 'platform' | 'any';
	modelClass: TypeOf<T>;
}

export interface PipeRef<T> {
	name: string;
	pure: boolean;
	modelClass: TypeOf<T>;
}
export interface DirectiveRef<T> {
	selector: string;

	modelClass: TypeOf<StructuralDirective<T>>; // | TypeOf<AttributeDirective<T>>;

	inputs: PropertyRef[];
	outputs: PropertyRef[];
	view: string;
	viewChild: ChildRef[];
	ViewChildren: ChildRef[];
	hostListeners: ListenerRef[];
	hostBindings: HostBindingRef[];
}

export interface ComponentRef<T> {
	selector: string;
	template: JSXRender<T> | JsxAttrComponent;
	// attrTemplate: JsxAttrComponent;
	styles: string;
	extend: Tag;

	viewClass: TypeOf<HTMLComponent<T>>; //CustomElementConstructor;
	modelClass: TypeOf<T>;

	inputs: PropertyRef[];
	outputs: PropertyRef[];
	view: string;
	viewChild: ChildRef[];
	ViewChildren: ChildRef[];
	hostBindings: HostBindingRef[];
	hostListeners: ListenerRef[];

	encapsulation: 'custom' | 'shadow-dom' | 'template' | 'shadow-dom-template';
	isShadowDom: boolean;
	shadowDomMode: ShadowRootMode;
	shadowDomDelegatesFocus: boolean;
}


export class Components {

	static addOptional(modelProperty: Object) {
	}

	static addInput(modelProperty: Object, modelName: string, viewNanme: string) {
		var bootstrap: BootstropMatadata = findByModelClassOrCreat(modelProperty);
		bootstrap.inputs = bootstrap.inputs || [];
		bootstrap.inputs.push(new PropertyRef(modelName, viewNanme));
	}

	static addOutput(modelProperty: Object, modelName: string, viewNanme: string) {
		var bootstrap: BootstropMatadata = findByModelClassOrCreat(modelProperty);
		bootstrap.outputs = bootstrap.outputs || [];
		bootstrap.outputs.push(new PropertyRef(modelName, viewNanme));
	}

	static setComponentView(modelProperty: Object, modelName: string) {
		var bootstrap: BootstropMatadata = findByModelClassOrCreat(modelProperty);
		bootstrap.view = modelName;
	}

	static addViewChild(modelProperty: Object, modelName: string, selector: string | typeof HTMLElement | CustomElementConstructor, childOptions?: ChildOptions) {
		var bootstrap: BootstropMatadata = findByModelClassOrCreat(modelProperty);
		bootstrap.viewChild = bootstrap.viewChild || [];
		bootstrap.viewChild.push(new ChildRef(modelName, selector, childOptions));
	}

	static addViewChildren(modelProperty: Object, modelName: string, selector: string | typeof HTMLElement | CustomElementConstructor) {
		var bootstrap: BootstropMatadata = findByModelClassOrCreat(modelProperty);
		bootstrap.ViewChildren = bootstrap.ViewChildren || [];
		bootstrap.ViewChildren.push(new ChildRef(modelName, selector));
	}

	static addHostListener(modelProperty: Object, propertyKey: string, eventName: string, args: string[]) {
		var bootstrap: BootstropMatadata = findByModelClassOrCreat(modelProperty);
		bootstrap.hostListeners = bootstrap.hostListeners || [];
		bootstrap.hostListeners.push(new ListenerRef(eventName, args, propertyKey));
	}

	static addHostBinding(modelProperty: Object, propertyKey: string, hostPropertyName: string) {
		var bootstrap: BootstropMatadata = findByModelClassOrCreat(modelProperty);
		bootstrap.hostBinding = bootstrap.hostBinding || [];
		bootstrap.hostBinding.push(
			new HostBindingRef(propertyKey, hostPropertyName)
		);
	}

	static defineDirective(modelClass: Function, opts: DirectiveOptions) {
		var bootstrap: BootstropMatadata = findByModelClassOrCreat(modelClass.prototype);
		for (const key in opts) {
			bootstrap[key] = Reflect.get(opts, key);
		}
		bootstrap.modelClass = modelClass;
		dependencyInjector.getInstance(ClassRegistry).registerDirective(modelClass);
	}

	static definePipe(modelClass: Function, opts: PipeOptions) {
		var bootstrap: BootstropMatadata = findByModelClassOrCreat(modelClass.prototype);
		for (const key in opts) {
			bootstrap[key] = Reflect.get(opts, key);
		}
		dependencyInjector.getInstance(ClassRegistry).registerPipe(modelClass);
	}

	static defineService(modelClass: Function, opts: ServiceOptions) {
		var bootstrap: BootstropMatadata = findByModelClassOrCreat(modelClass.prototype);
		for (const key in opts) {
			bootstrap[key] = Reflect.get(opts, key);
		}
		dependencyInjector.getInstance(ClassRegistry).registerService(modelClass);
	}

	static defineComponent<T extends Object>(modelClass: TypeOf<T>, opts: ComponentOptions<T>) {
		var bootstrap: BootstropMatadata = findByModelClassOrCreat(modelClass.prototype);

		var componentRef: ComponentRef<T> = opts as unknown as ComponentRef<T>;
		for (const key in bootstrap) {
			Reflect.set(componentRef, key, bootstrap[key]);
		}
		componentRef.extend = findByTagName(opts.extend);

		if (typeof componentRef.template === 'string' && componentRef.template) {
			componentRef.template = toJsxAttrComponent(componentRef.template);
			// componentRef.template = toJSXRender(componentRef.template);
			// componentRef.template = htmlTemplateToJSXRender(componentRef.template);
		}

		if (!componentRef.template && /template/g.test(componentRef.encapsulation)) {
			const template = document.querySelector('#' + componentRef.selector);
			if (template && template instanceof HTMLTemplateElement) {
				componentRef.template = htmlTemplateToJSXRender(template);
			} else {
				// didn't find this template in 'index.html' document
			}
		}

		componentRef.inputs = componentRef.inputs || [];
		componentRef.outputs = componentRef.outputs || [];
		componentRef.viewChild = componentRef.viewChild || [];
		componentRef.ViewChildren = componentRef.ViewChildren || [];
		componentRef.hostBindings = componentRef.hostBindings || [];
		componentRef.hostListeners = componentRef.hostListeners || [];
		componentRef.encapsulation = componentRef.encapsulation || 'custom';
		componentRef.isShadowDom = /shadow-dom/g.test(componentRef.encapsulation);
		componentRef.shadowDomMode = componentRef.shadowDomMode || 'open';
		componentRef.shadowDomDelegatesFocus = componentRef.shadowDomDelegatesFocus === true || false;

		componentRef.modelClass = modelClass;
		componentRef.viewClass = initCustomElementView(modelClass, componentRef);
		const componentRefName = componentRef.viewClass.name + 'ComponentRef';
		setBootstrapTagNameMatadata(modelClass, componentRefName, componentRef);

		dependencyInjector.getInstance(ClassRegistry).registerComponent(modelClass);
		dependencyInjector
			.getInstance(ClassRegistry)
			.registerView(bootstrap.viewClass);
		// setBootstrapMatadata(modelClass.prototype, componentRef);

		const options: ElementDefinitionOptions = {};
		const parentTagName = componentRef.extend?.name;
		if (parentTagName) {
			if (parentTagName !== '!' && parentTagName.indexOf('-') === -1) {
				options.extends = parentTagName;
			}
		}

		customElements.define(
			componentRef?.selector as string,
			componentRef.viewClass as CustomElementConstructor,
			options
		);

	}
}
