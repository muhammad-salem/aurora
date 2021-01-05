
import { AuroraNode, AuroraRenderNode } from '@aurorats/jsx';
import { findByModelClassOrCreat, setBootstrapTagNameMetadata } from '@aurorats/metadata';
import { findByTagName, Tag } from '@aurorats/element';
import { htmlParser, templateParser } from '@aurorats/html-parser';

import { HTMLComponent } from './custom-element.js';
import ClassRegistryProvider from '../providers/provider.js';
import { StructuralDirective } from '../directive/directive.js';
import { initCustomElementView } from '../view/view.js';
import { TypeOf } from '../utils/utils.js';
import {
	ComponentOptions, ChildOptions, PipeOptions,
	ServiceOptions, DirectiveOptions
} from '../annotation/decorators.js';

export class PropertyRef {
	constructor(public modelProperty: string, private _viewName?: string) { }
	get viewAttribute(): string {
		return this._viewName || this.modelProperty;
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

export interface BootstrapMetadata {
	[key: string]: any;
}

export interface ServiceRef<T> {
	provideIn: TypeOf<CustomElementConstructor> | 'root' | 'platform' | 'any';
	modelClass: TypeOf<T>;
	name: string;
}

export interface PipeRef<T> {
	name: string;
	asynchronous?: boolean;
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
	template: AuroraNode | AuroraRenderNode<T>;
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
		var bootstrap: BootstrapMetadata = findByModelClassOrCreat(modelProperty);
		bootstrap.inputs = bootstrap.inputs || [];
		bootstrap.inputs.push(new PropertyRef(modelName, viewNanme));
	}

	static addOutput(modelProperty: Object, modelName: string, viewNanme: string) {
		var bootstrap: BootstrapMetadata = findByModelClassOrCreat(modelProperty);
		bootstrap.outputs = bootstrap.outputs || [];
		bootstrap.outputs.push(new PropertyRef(modelName, viewNanme));
	}

	static setComponentView(modelProperty: Object, modelName: string) {
		var bootstrap: BootstrapMetadata = findByModelClassOrCreat(modelProperty);
		bootstrap.view = modelName;
	}

	static addViewChild(modelProperty: Object, modelName: string, selector: string | typeof HTMLElement | CustomElementConstructor, childOptions?: ChildOptions) {
		var bootstrap: BootstrapMetadata = findByModelClassOrCreat(modelProperty);
		bootstrap.viewChild = bootstrap.viewChild || [];
		bootstrap.viewChild.push(new ChildRef(modelName, selector, childOptions));
	}

	static addViewChildren(modelProperty: Object, modelName: string, selector: string | typeof HTMLElement | CustomElementConstructor) {
		var bootstrap: BootstrapMetadata = findByModelClassOrCreat(modelProperty);
		bootstrap.ViewChildren = bootstrap.ViewChildren || [];
		bootstrap.ViewChildren.push(new ChildRef(modelName, selector));
	}

	static addHostListener(modelProperty: Object, propertyKey: string, eventName: string, args: string[]) {
		var bootstrap: BootstrapMetadata = findByModelClassOrCreat(modelProperty);
		bootstrap.hostListeners = bootstrap.hostListeners || [];
		bootstrap.hostListeners.push(new ListenerRef(eventName, args, propertyKey));
	}

	static addHostBinding(modelProperty: Object, propertyKey: string, hostPropertyName: string) {
		var bootstrap: BootstrapMetadata = findByModelClassOrCreat(modelProperty);
		bootstrap.hostBinding = bootstrap.hostBinding || [];
		bootstrap.hostBinding.push(
			new HostBindingRef(propertyKey, hostPropertyName)
		);
	}

	static defineDirective(modelClass: Function, opts: DirectiveOptions) {
		var bootstrap: BootstrapMetadata = findByModelClassOrCreat(modelClass.prototype);
		for (const key in opts) {
			bootstrap[key] = Reflect.get(opts, key);
		}
		bootstrap.modelClass = modelClass;
		ClassRegistryProvider.registerDirective(modelClass);
	}

	static definePipe(modelClass: Function, opts: PipeOptions) {
		var bootstrap: BootstrapMetadata = findByModelClassOrCreat(modelClass.prototype);
		for (const key in opts) {
			bootstrap[key] = Reflect.get(opts, key);
		}
		bootstrap.modelClass = modelClass;
		ClassRegistryProvider.registerPipe(modelClass);
	}

	static defineService(modelClass: Function, opts: ServiceOptions) {
		var bootstrap: BootstrapMetadata = findByModelClassOrCreat(modelClass.prototype);
		for (const key in opts) {
			bootstrap[key] = Reflect.get(opts, key);
		}
		bootstrap.modelClass = modelClass;
		bootstrap.name = modelClass.name;
		ClassRegistryProvider.registerService(modelClass);
	}

	static defineComponent<T extends Object>(modelClass: TypeOf<T>, opts: ComponentOptions<T>) {
		var bootstrap: BootstrapMetadata = findByModelClassOrCreat(modelClass.prototype);

		var componentRef: ComponentRef<T> = opts as unknown as ComponentRef<T>;
		for (const key in bootstrap) {
			Reflect.set(componentRef, key, bootstrap[key]);
		}
		componentRef.extend = findByTagName(opts.extend);

		if (typeof componentRef.template === 'string' && componentRef.template) {
			componentRef.template = htmlParser.toAuroraRootNode(componentRef.template);
		}

		if (!componentRef.template && /template/g.test(componentRef.encapsulation)) {
			const template = document.querySelector('#' + componentRef.selector);
			if (template && template instanceof HTMLTemplateElement) {
				componentRef.template = templateParser.parse(template);
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
		setBootstrapTagNameMetadata(modelClass, componentRefName, componentRef);

		ClassRegistryProvider.registerComponent(modelClass);
		ClassRegistryProvider.registerView(bootstrap.viewClass);
		// setBootstrapMetadata(modelClass.prototype, componentRef);

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
