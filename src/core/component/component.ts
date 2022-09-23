import type { TypeOf } from '../utils/typeof.js';
import {
	findByTagName, Tag, htmlParser, templateParser,
	DomNode, DomRenderNode, canAttachShadow, directiveRegistry
} from '@ibyar/elements';

import { HTMLComponent, ValueControl } from './custom-element.js';
import { ClassRegistryProvider } from '../providers/provider.js';
import { AttributeDirective, StructuralDirective } from '../directive/directive.js';
import { initCustomElementView } from '../view/view.js';
import { buildExpressionNodes } from '../html/expression.js';
import {
	ComponentOptions, PipeOptions,
	ServiceOptions, DirectiveOptions
} from '../annotation/decorators.js';
import { ZoneType } from '../zone/bootstrap.js';
import {
	BootstrapMetadata, ChildRef, HostBindingRef,
	InputPropertyRef, ListenerRef, OutputPropertyRef,
	PropertyRef, ReflectComponents
} from './reflect.js';


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
	zone: ZoneType;

	modelClass: TypeOf<StructuralDirective> | TypeOf<AttributeDirective>;

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
	template: DomNode | DomRenderNode<T>;
	// attrTemplate: JsxAttrComponent;
	styles: string;
	extend: Tag;

	viewClass: TypeOf<HTMLComponent<T>> & CustomElementConstructor;
	modelClass: TypeOf<T>;

	inputs: InputPropertyRef[];
	outputs: OutputPropertyRef[];
	view: string;
	viewChild: ChildRef[];
	ViewChildren: ChildRef[];
	hostBindings: HostBindingRef[];
	hostListeners: ListenerRef[];

	encapsulation: 'custom' | 'shadow-dom' | 'template' | 'shadow-dom-template';
	isShadowDom: boolean;
	shadowDomMode: ShadowRootMode;
	shadowDomDelegatesFocus: boolean;
	formAssociated: boolean | TypeOf<ValueControl<any>>;
	zone: ZoneType;
}

export class Components {

	static defineDirective(modelClass: Function, opts: DirectiveOptions) {
		const bootstrap: BootstrapMetadata = ReflectComponents.getOrCreateBootstrap(modelClass.prototype);
		for (const key in opts) {
			bootstrap[key] = Reflect.get(opts, key);
		}
		bootstrap.modelClass = modelClass;
		ClassRegistryProvider.registerDirective(modelClass);
		directiveRegistry.register(opts.selector, {
			inputs: (bootstrap.inputs as PropertyRef[])?.map(input => input.viewAttribute),
			outputs: (bootstrap.outputs as PropertyRef[])?.map(output => output.viewAttribute),
		});
	}

	static definePipe(modelClass: Function, opts: PipeOptions) {
		const bootstrap: BootstrapMetadata = ReflectComponents.getOrCreateBootstrap(modelClass.prototype);
		for (const key in opts) {
			bootstrap[key] = Reflect.get(opts, key);
		}
		bootstrap.modelClass = modelClass;
		ClassRegistryProvider.registerPipe(modelClass);
	}

	static defineService(modelClass: Function, opts: ServiceOptions) {
		const bootstrap: BootstrapMetadata = ReflectComponents.getOrCreateBootstrap(modelClass.prototype);
		for (const key in opts) {
			bootstrap[key] = Reflect.get(opts, key);
		}
		bootstrap.modelClass = modelClass;
		bootstrap.name = modelClass.name;
		ClassRegistryProvider.registerService(modelClass);
	}

	static defineComponent<T extends Object>(modelClass: TypeOf<T>, opts: ComponentOptions<T>) {
		const bootstrap: BootstrapMetadata = ReflectComponents.getOrCreateBootstrap(modelClass.prototype);

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
		} else if (typeof componentRef.template === 'object') {
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

		if (!(componentRef.formAssociated === true || typeof componentRef.formAssociated === 'function')) {
			componentRef.formAssociated = false;
		}

		if (componentRef.isShadowDom && componentRef.extend.name) {
			componentRef.isShadowDom = canAttachShadow(componentRef.extend.name);
		}

		componentRef.modelClass = modelClass;
		componentRef.viewClass = initCustomElementView(modelClass, componentRef);
		ReflectComponents.setComponentRef(componentRef.modelClass, componentRef);
		ReflectComponents.setComponentRef(componentRef.viewClass, componentRef);

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
			componentRef.selector as string,
			componentRef.viewClass as CustomElementConstructor,
			options
		);

	}

	static defineView<T extends HTMLElement>(viewClass: TypeOf<T>, opt: { selector: string } & ElementDefinitionOptions) {
		ClassRegistryProvider.registerView(viewClass);
		customElements.define(
			opt.selector as string,
			viewClass,
			Object.assign({}, opt, { selector: undefined }),
		);
	}
}
