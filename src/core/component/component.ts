import type { TypeOf } from '../utils/typeof.js';
import type { ExpressionNode } from '@ibyar/expressions';
import {
	findByTagName, Tag, htmlParser, templateParser,
	DOMNode, DOMRenderNode, canAttachShadow
} from '@ibyar/elements';
import { findByModelClassOrCreat, setBootstrapMetadata } from '@ibyar/metadata';

import { HTMLComponent } from './custom-element.js';
import { ClassRegistryProvider } from '../providers/provider.js';
import { AttributeDirective, StructuralDirective } from '../directive/directive.js';
import { initCustomElementView } from '../view/view.js';
import { buildExpressionNodes } from '../html/expression.js';
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

	modelClass: TypeOf<StructuralDirective<T>> | TypeOf<AttributeDirective>;

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
	template: DOMNode<ExpressionNode> | DOMRenderNode<T, ExpressionNode>;
	// attrTemplate: JsxAttrComponent;
	styles: string;
	extend: Tag;

	viewClass: TypeOf<HTMLComponent<T>> & CustomElementConstructor;
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

	static addInput(modelProperty: Object, modelName: string, viewName: string) {
		var bootstrap: BootstrapMetadata = findByModelClassOrCreat(modelProperty);
		bootstrap.inputs = bootstrap.inputs || [];
		bootstrap.inputs.push(new PropertyRef(modelName, viewName));
	}

	static addOutput(modelProperty: Object, modelName: string, viewName: string) {
		var bootstrap: BootstrapMetadata = findByModelClassOrCreat(modelProperty);
		bootstrap.outputs = bootstrap.outputs || [];
		bootstrap.outputs.push(new PropertyRef(modelName, viewName));
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

		if (typeof componentRef.template === 'string') {
			if (componentRef.styles) {
				const template = `<style>${componentRef.styles}</style>${componentRef.template}`;
				componentRef.template = htmlParser.toDomRootNode(template);
			} else {
				componentRef.template = htmlParser.toDomRootNode(componentRef.template);
			}
			buildExpressionNodes(componentRef.template);
		}

		if (!componentRef.template && /template/g.test(componentRef.encapsulation)) {
			const template = document.querySelector('#' + componentRef.selector);
			if (template && template instanceof HTMLTemplateElement) {
				componentRef.template = templateParser.parse(template);
				buildExpressionNodes(componentRef.template);
			} else {
				// didn't find this template in 'index.html' document
			}
		}

		componentRef.inputs ||= [];
		componentRef.outputs ||= [];
		componentRef.viewChild ||= [];
		componentRef.ViewChildren ||= [];
		componentRef.hostBindings ||= [];
		componentRef.hostListeners ||= [];
		componentRef.encapsulation ||= 'custom';
		componentRef.isShadowDom = /shadow-dom/g.test(componentRef.encapsulation);
		componentRef.shadowDomMode ||= 'open';
		componentRef.shadowDomDelegatesFocus = componentRef.shadowDomDelegatesFocus === true || false;

		if (componentRef.isShadowDom && componentRef.extend.name) {
			componentRef.isShadowDom = canAttachShadow(componentRef.extend.name);
		}

		componentRef.modelClass = modelClass;
		componentRef.viewClass = initCustomElementView(modelClass, componentRef);
		setBootstrapMetadata(componentRef.viewClass, componentRef);

		ClassRegistryProvider.registerComponent(modelClass);
		ClassRegistryProvider.registerView(bootstrap.viewClass);

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
