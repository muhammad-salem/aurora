import type { TypeOf } from '../utils/typeof.js';
import type { ZoneType } from '../zone/bootstrap.js';
import {
	findByTagName, Tag, htmlParser, templateParser,
	DomNode, DomRenderNode, canAttachShadow,
	directiveRegistry, DomElementNode, Attribute
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
import {
	BootstrapMetadata, ChildRef, HostBindingRef,
	InputPropertyRef, HostListenerRef, OutputPropertyRef,
	PropertyRef, ReflectComponents
} from './reflect.js';
import { deserializeExpressionNodes } from '../html/deserialize.js';


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
	zone?: ZoneType;

	modelClass: TypeOf<StructuralDirective> | TypeOf<AttributeDirective>;

	inputs: PropertyRef[];
	outputs: PropertyRef[];
	view: string;
	viewChild: ChildRef[];
	ViewChildren: ChildRef[];
	hostListeners: HostListenerRef[];
	hostBindings: HostBindingRef[];
	viewBindings: DomElementNode[];
}

export interface ComponentRef<T> {
	selector: string;
	template: DomNode | DomRenderNode<T>;
	compiledTemplate?: DomNode;
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
	hostListeners: HostListenerRef[];
	viewBindings: DomElementNode[];

	encapsulation: 'custom' | 'shadow-dom' | 'template' | 'shadow-dom-template';
	isShadowDom: boolean;
	shadowDomMode: ShadowRootMode;
	shadowDomDelegatesFocus: boolean;
	formAssociated: boolean | TypeOf<ValueControl<any>>;
	zone?: ZoneType;
}

type ViewBindingOption = {
	hostBindings?: HostBindingRef[];
	hostListeners?: HostListenerRef[];
};

export class Components {

	private static EMPTY_LIST = Object.freeze<any>([]);
	private static emptyList<T>(): T[] {
		return Components.EMPTY_LIST as T[];
	}

	private static parseHostBindings(prototype: Record<PropertyKey, any>, option: ViewBindingOption, selector?: string): DomElementNode[] {
		option.hostListeners ??= [];
		option.hostBindings ??= [];
		const listeners = option.hostListeners.reduce((list, listener) => {
			const details = listener.eventName.split(':', 2) as [string, string] | [string];
			const source = details.length === 2 ? details[0] : 'this';
			if (details.length === 2) {
				listener.eventName = details[1];
			}
			list[source] ??= [];
			list[source].push(listener);
			return list;
		}, {} as Record<string, HostListenerRef[]>) ?? {};

		return Object.keys(listeners).map(host => {
			const hostOption: ViewBindingOption = { hostListeners: listeners[host] };
			if (host === 'this') {
				hostOption.hostBindings = option.hostBindings;
			}
			const node = Components.parseHostBinding(prototype, hostOption, selector);
			node.templateRefName = new Attribute(host, undefined);
			return node;
		})
	}

	private static parseHostBinding(prototype: Record<PropertyKey, any>, option: ViewBindingOption, selector?: string): DomElementNode {
		const inputs = option.hostBindings?.map(binding => {
			const descriptor = Object.getOwnPropertyDescriptor(prototype, binding.modelPropertyName);
			if (typeof descriptor?.value === 'function') {
				return `[${binding.hostPropertyName}]="${binding.modelPropertyName}()"`
			}
			return `[${binding.hostPropertyName}]="${binding.modelPropertyName}"`;
		}) ?? [];
		const outputs = option.hostListeners?.map(
			listener => `(${listener.eventName})="${listener.modelCallbackName}(${listener.args.join(', ')})"`
		) ?? [];
		selector ??= 'div';
		const template = `<${selector} ${inputs.join(' ')} ${outputs.join(' ')}></${selector}>`;
		const viewBindings = htmlParser.toDomRootNode(template) as DomElementNode;
		buildExpressionNodes(viewBindings);
		return viewBindings;
	}

	static defineDirective(modelClass: Function, opts: DirectiveOptions) {
		const bootstrap: BootstrapMetadata = ReflectComponents.getOrCreateBootstrap(modelClass.prototype);
		Object.assign(bootstrap, opts);
		bootstrap.viewBindings = Components.emptyList();
		if (bootstrap.hostListeners?.length || bootstrap.hostBindings?.length) {
			bootstrap.viewBindings = Components.parseHostBindings(modelClass.prototype, {
				hostBindings: bootstrap.hostBindings,
				hostListeners: bootstrap.hostListeners,
			});
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
		const componentRef = Object.assign({}, opts, bootstrap) as any as ComponentRef<T>;
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
		} else if (typeof componentRef.compiledTemplate === 'object') {
			htmlParser.deserializeNode(componentRef.compiledTemplate);
			deserializeExpressionNodes(componentRef.compiledTemplate);
			componentRef.template = componentRef.compiledTemplate;
			componentRef.compiledTemplate = undefined;
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

		componentRef.inputs ||= Components.emptyList();
		componentRef.outputs ||= Components.emptyList();
		componentRef.viewChild ||= Components.emptyList();
		componentRef.ViewChildren ||= Components.emptyList();
		componentRef.hostBindings ||= Components.emptyList();
		componentRef.hostListeners ||= Components.emptyList();
		componentRef.viewBindings ||= Components.emptyList();
		componentRef.encapsulation ||= 'custom';
		componentRef.isShadowDom = /shadow-dom/g.test(componentRef.encapsulation);
		componentRef.shadowDomMode ||= 'open';
		componentRef.shadowDomDelegatesFocus = componentRef.shadowDomDelegatesFocus === true || false;

		if (componentRef.hostListeners.length || componentRef.hostBindings.length) {
			componentRef.viewBindings = Components.parseHostBindings(modelClass.prototype, {
				hostBindings: componentRef.hostBindings,
				hostListeners: componentRef.hostListeners,
			}, componentRef.selector);
		}

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
