import type { MetadataClass, MetadataContext } from '@ibyar/decorators';
import type { Class, TypeOf } from '../utils/typeof.js';
import type { ZoneType } from '../zone/bootstrap.js';
import {
	findByTagName, Tag, htmlParser, templateParser,
	DomNode, DomRenderNode, canAttachShadow,
	directiveRegistry, DomElementNode,
	DomFragmentNode, DomParentNode,
	isValidCustomElementName
} from '@ibyar/elements';

import { HTMLComponent, ValueControl } from './custom-element.js';
import { ClassRegistryProvider } from '../providers/provider.js';
import { AttributeDirective, StructuralDirective } from '../directive/directive.js';
import { initCustomElementView } from '../view/view.js';
import { buildExpressionNodes } from '../html/expression.js';
import {
	ComponentOptions, PipeOptions,
	ServiceOptions, DirectiveOptions
} from '../annotation/options.js';
import {
	ChildRef, HostBindingRef, InputPropertyRef,
	ListenerRef, OutputPropertyRef, PropertyRef
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
	exportAs?: string;
	zone?: ZoneType;

	modelClass: TypeOf<StructuralDirective> | TypeOf<AttributeDirective>;

	inputs: PropertyRef[];
	outputs: PropertyRef[];
	view: string;
	viewChild: ChildRef[];
	ViewChildren: ChildRef[];
	hostListeners: ListenerRef[];
	hostBindings: HostBindingRef[];
	viewBindings?: DomElementNode;
}

export interface ComponentRef<T> {
	selector: string;
	template: DomNode | DomRenderNode<T>;
	compiledTemplate?: DomNode;
	// attrTemplate: JsxAttrComponent;
	styles: string;
	extend: Tag;
	extendCustomElement: boolean;

	viewClass: MetadataClass<HTMLComponent<T>> & CustomElementConstructor;
	modelClass: TypeOf<T>;

	inputs: InputPropertyRef[];
	outputs: OutputPropertyRef[];
	view: string;
	viewChild: ChildRef[];
	ViewChildren: ChildRef[];
	hostBindings: HostBindingRef[];
	hostListeners: ListenerRef[];
	viewBindings?: DomElementNode;
	windowBindings?: DomElementNode;

	encapsulation: 'custom' | 'shadow-dom' | 'template' | 'shadow-dom-template' | 'shadow-slot';
	isShadowDom: boolean;
	shadowRootInit: ShadowRootInit;
	formAssociated: boolean | TypeOf<ValueControl<any>>;
	zone?: ZoneType;
}

type ViewBindingOption = {
	prototype: Record<PropertyKey, any>;
	hostBindings?: HostBindingRef[];
	hostListeners?: ListenerRef[];
	selector?: string;
};

type HostNode = {
	host?: DomElementNode;
	window?: DomElementNode;
	template?: DomElementNode[];
};

const DEFAULT_SHADOW_ROOT_INIT: ShadowRootInit = { mode: 'open', delegatesFocus: false, slotAssignment: 'named' };

export class Components {

	private static EMPTY_LIST = Object.freeze<any>([]);
	private static emptyList<T>(): T[] {
		return Components.EMPTY_LIST as T[];
	}

	private static patchTemplate(child: DomNode, templates: DomElementNode[]): void {
		if (child instanceof DomElementNode && child.templateRefName?.name) {
			const ref = templates.find(node => child.templateRefName?.name === node.templateRefName?.name);
			if (ref?.outputs) {
				(child.outputs ??= []).push(...ref.outputs);
			}
		}
		if (child instanceof DomParentNode) {
			child.children?.forEach(node => Components.patchTemplate(node, templates));
		}
	}

	private static createOutputs(Listeners?: ListenerRef[]) {
		return Listeners?.map(
			listener => `(${listener.eventName})="${listener.modelCallbackName}(${listener.args.join(', ')})"`
		).join(' ') ?? ''
	}

	private static parseHostNode(option: ViewBindingOption): HostNode {
		const inputs = option.hostBindings?.map(binding => {
			const descriptor = Object.getOwnPropertyDescriptor(option.prototype, binding.modelPropertyName);
			if (typeof descriptor?.value === 'function') {
				return `[${binding.hostPropertyName}]="${binding.modelPropertyName}()"`
			}
			return `[${binding.hostPropertyName}]="${binding.modelPropertyName}"`;
		}).join(' ') ?? '';

		const hostListeners: ListenerRef[] = [];
		const windowListeners: ListenerRef[] = [];
		const templateListeners: Record<string, ListenerRef[]> = {};

		option.hostListeners?.forEach(listener => {
			const [host, event] = listener.eventName.split(':', 2);
			if (event === undefined) {
				hostListeners.push(listener);
			} else if ('window' === host.toLowerCase()) {
				windowListeners.push(new ListenerRef(event, listener.args, listener.modelCallbackName));
			} else {
				(templateListeners[host] ??= []).push(new ListenerRef(event, listener.args, listener.modelCallbackName));
			}
		});

		const result: HostNode = {};

		if (hostListeners.length) {
			const hostOutputs = Components.createOutputs(hostListeners);
			const selector = option.selector ?? 'div';
			const hostTemplate = `<${selector} ${inputs} ${hostOutputs}></${selector}>`;
			result.host = htmlParser.toDomRootNode(hostTemplate) as DomElementNode;
			buildExpressionNodes(result.host);
		}

		if (windowListeners.length) {
			const windowOutputs = Components.createOutputs(windowListeners);
			const windowTemplate = `<window ${windowOutputs}></window>`;
			result.window = htmlParser.toDomRootNode(windowTemplate) as DomElementNode;
			buildExpressionNodes(result.window);
		}

		const templateHosts = Object.keys(templateListeners);
		if (templateHosts.length) {
			const template = templateHosts.map(host => {
				const hostOutputs = Components.createOutputs(templateListeners[host]);
				return `<template #${host} ${hostOutputs}></template>`;
			}).join('');
			const templateNodes = htmlParser.toDomRootNode(template) as DomElementNode | DomFragmentNode;
			buildExpressionNodes(templateNodes);
			result.template = templateNodes instanceof DomFragmentNode
				? templateNodes.children?.filter(child => child instanceof DomElementNode) as DomElementNode[] ?? []
				: [templateNodes];
		}
		return result;
	}

	static defineDirective(modelClass: MetadataClass, opts: DirectiveOptions, metadata: MetadataContext) {
		Object.assign(metadata, opts);
		if (metadata.hostListeners?.length || metadata.hostBindings?.length) {
			const hostNode = Components.parseHostNode({
				prototype: modelClass.prototype,
				hostBindings: metadata.hostBindings,
				hostListeners: metadata.hostListeners,
			});
			metadata.viewBindings = hostNode.host;
		}
		metadata.modelClass = modelClass;
		ClassRegistryProvider.registerDirective(modelClass);
		directiveRegistry.register(opts.selector, {
			inputs: (metadata.inputs as PropertyRef[])?.map(input => input.viewAttribute),
			outputs: (metadata.outputs as PropertyRef[])?.map(output => output.viewAttribute),
		});
	}

	static definePipe<T extends Class>(modelClass: MetadataClass<T>, opts: PipeOptions, metadata: MetadataContext) {
		Object.assign(metadata, opts);
		metadata.modelClass = modelClass;
		ClassRegistryProvider.registerPipe(modelClass);
	}

	static defineService<T extends Class>(modelClass: MetadataClass<T>, opts: ServiceOptions, metadata: MetadataContext) {
		Object.assign(metadata, opts);
		metadata.modelClass = modelClass;
		metadata.name = modelClass.name;
		ClassRegistryProvider.registerService(modelClass);
	}

	static defineComponent<T extends Class>(modelClass: MetadataClass<T>, opts: ComponentOptions<T>, metadata: MetadataContext) {
		const componentRef = Object.assign(metadata, opts) as any as ComponentRef<T>;
		componentRef.extend = findByTagName(opts.extend);
		componentRef.extendCustomElement = !!opts.extend && isValidCustomElementName(opts.extend);

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
		componentRef.encapsulation ||= 'custom';
		componentRef.isShadowDom = /shadow/g.test(componentRef.encapsulation);
		if (componentRef.isShadowDom) {
			componentRef.shadowRootInit = Object.assign({}, DEFAULT_SHADOW_ROOT_INIT, (componentRef.shadowRootInit ?? {}));
		}

		if (componentRef.hostListeners.length || componentRef.hostBindings.length) {
			const hostNode = Components.parseHostNode({
				prototype: modelClass.prototype,
				selector: componentRef.selector,
				hostBindings: componentRef.hostBindings,
				hostListeners: componentRef.hostListeners,
			});
			componentRef.viewBindings = hostNode.host;
			componentRef.windowBindings = hostNode.window;

			if (typeof componentRef.template === 'function') {
				const creator = componentRef.template;
				componentRef.template = (model: T) => {
					const template = creator(model);
					if (hostNode.template) {
						Components.patchTemplate(template, hostNode.template);
					}
					return template;
				};
			} else if (hostNode.template) {
				Components.patchTemplate(componentRef.template, hostNode.template);
			}

		}

		if (!(componentRef.formAssociated === true || typeof componentRef.formAssociated === 'function')) {
			componentRef.formAssociated = false;
		}

		if (componentRef.isShadowDom && componentRef.extend.name) {
			componentRef.isShadowDom = canAttachShadow(componentRef.extend.name);
		}

		componentRef.modelClass = modelClass;
		componentRef.viewClass = initCustomElementView(modelClass, componentRef);

		ClassRegistryProvider.registerComponent(modelClass);
		ClassRegistryProvider.registerView(componentRef.viewClass);

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

	static defineView<T extends HTMLElement>(viewClass: MetadataClass<T>, opt: { selector: string } & ElementDefinitionOptions) {
		ClassRegistryProvider.registerView(viewClass);
		const { selector, ...definition } = opt;
		customElements.define(
			selector,
			viewClass,
			definition,
		);
	}

}
