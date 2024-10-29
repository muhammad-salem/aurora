import type { MetadataClass, MetadataContext } from '@ibyar/decorators';
import type { Type } from '../utils/typeof.js';
import type { ZoneType } from '../zone/bootstrap.js';
import {
	findByTagName, Tag, htmlParser, templateParser,
	DomNode, DomRenderNode, canAttachShadow,
	directiveRegistry, DomElementNode,
	DomParentNode, isValidCustomElementName
} from '@ibyar/elements';

import { HTMLComponent, ValueControl } from './custom-element.js';
import { classRegistryProvider } from '../providers/provider.js';
import { AttributeDirective, StructuralDirective } from '../directive/directive.js';
import { initCustomElementView } from '../view/view.js';
import { buildExpressionNodes } from '../html/expression.js';
import {
	ComponentOptions, PipeOptions,
	InjectableOptions, DirectiveOptions
} from '../annotation/options.js';
import {
	ChildRef, HostBindingRef, InputPropertyRef,
	ListenerRef, OutputPropertyRef, PropertyRef,
	ReflectComponents
} from './reflect.js';
import { deserializeExpressionNodes } from '../html/deserialize.js';
import { parseHostNode } from '../html/host.js';
import { provide } from '../di/inject.js';
import { RuntimeClassMetadata, SignalRuntimeMetadata } from '../signals/runtime.js';


export interface InjectableRef<T> {
	provideIn: Type<CustomElementConstructor> | 'root' | 'platform' | 'any';
	modelClass: Type<T>;
	name: string;
}

export interface PipeRef<T> {
	name: string;
	asynchronous?: boolean;
	modelClass: Type<T>;
}
export interface DirectiveRef<T> {
	selector: string;
	exportAs?: string;
	zone?: ZoneType;

	modelClass: Type<StructuralDirective> | Type<AttributeDirective>;

	inputs: PropertyRef[];
	outputs: PropertyRef[];
	view: string;
	viewChild: ChildRef[];
	ViewChildren: ChildRef[];
	hostListeners: ListenerRef[];
	hostBindings: HostBindingRef[];
	viewBindings?: DomElementNode;
	signals: SignalRuntimeMetadata[];
}

export interface ComponentRef<T> {
	selector: string;
	template: DomNode | DomRenderNode<T>;
	compiledTemplate?: DomNode;
	styles: string;
	extend: Tag;
	extendCustomElement: boolean;

	viewClass: MetadataClass<HTMLComponent<T>> & CustomElementConstructor;
	modelClass: Type<T>;

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
	disabledFeatures?: ('internals' | 'shadow')[];
	formAssociated: boolean | Type<ValueControl<any>>;
	zone?: ZoneType;
	signals: SignalRuntimeMetadata[];
}

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


	static defineDirective(modelClass: MetadataClass, opts: DirectiveOptions, metadata: MetadataContext) {
		if (!(opts as any as DirectiveRef<Type<any>>).signals) {
			(opts as any as DirectiveRef<Type<any>>).signals = RuntimeClassMetadata.scanMetadata(modelClass);
		}
		this.scanRuntimeSignals(modelClass, opts as any as DirectiveRef<Type<any>>, metadata);
		Object.assign(metadata, opts);
		if (metadata.hostListeners?.length || metadata.hostBindings?.length) {
			const hostNode = parseHostNode({
				prototype: modelClass.prototype,
				hostBindings: metadata.hostBindings,
				hostListeners: metadata.hostListeners,
			});
			metadata.viewBindings = hostNode.host;
		}
		metadata.modelClass = modelClass;
		classRegistryProvider.registerDirective(modelClass);
		const successors: string[] = [];
		if (metadata.successor) {
			successors.push(metadata.successor.trim());
		}
		if (Array.isArray(metadata.successors)) {
			successors.push(...metadata.successors.map(s => s.trim()));
		}
		metadata.successors = successors;
		directiveRegistry.register(opts.selector, {
			inputs: (metadata.inputs as PropertyRef[])?.map(input => input.viewAttribute),
			outputs: (metadata.outputs as PropertyRef[])?.map(output => output.viewAttribute),
			successors: successors,
		});
	}

	static definePipe<T extends Type<any>>(modelClass: MetadataClass<T>, opts: PipeOptions, metadata: MetadataContext) {
		Object.assign(metadata, opts);
		metadata.modelClass = modelClass;
		classRegistryProvider.registerPipe(modelClass);
	}

	static defineInjectable<T extends Type<any>>(modelClass: MetadataClass<T>, opts: InjectableOptions, metadata: MetadataContext) {
		Object.assign(metadata, opts);
		metadata.modelClass = modelClass;
		metadata.name = modelClass.name;
		classRegistryProvider.registerInjectable(modelClass);
		provide(modelClass);
	}

	static defineComponent<T extends Type<any>>(modelClass: MetadataClass<T>, opts: ComponentOptions<T>, metadata: MetadataContext) {
		if (!(opts as any as ComponentRef<T>).signals) {
			(opts as any as ComponentRef<T>).signals = RuntimeClassMetadata.scanMetadata(modelClass);
		}
		this.scanRuntimeSignals(modelClass, opts as any as ComponentRef<T>, metadata);
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
			const hostNode = parseHostNode({
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

		classRegistryProvider.registerComponent(modelClass);
		classRegistryProvider.registerView(componentRef.viewClass);

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
		classRegistryProvider.registerView(viewClass);
		const { selector, ...definition } = opt;
		customElements.define(
			selector,
			viewClass,
			definition,
		);
	}

	private static scanRuntimeSignals<T extends Type<any>>(modelClass: MetadataClass<T>, opts: { signals: SignalRuntimeMetadata[] }, metadata: MetadataContext) {
		if (!opts.signals) {
			return;
		}
		const signals = opts.signals;
		signals.filter(item => item.signal === 'input')
			.flatMap(item => item.options)
			.forEach(option => ReflectComponents.addInput(metadata, option.name, option.alias));
		signals.filter(item => item.signal === 'formValue')
			.flatMap(item => item.options)
			.forEach(option => ReflectComponents.addInput(metadata, option.name, 'view'));
		signals.filter(item => item.signal === 'output')
			.flatMap(item => item.options)
			.forEach(option => ReflectComponents.addOutput(metadata, option.name, option.alias, {}));
		signals.filter(item => item.signal === 'model')
			.flatMap(item => item.options)
			.forEach(option => {
				ReflectComponents.addInput(metadata, option.name, option.alias);
				ReflectComponents.addOutput(metadata, option.name, option.alias, {});
			});
		signals.filter(item => item.signal === 'view')
			.flatMap(item => item.options)
			.forEach(option => ReflectComponents.setComponentView(metadata, option.name));
	}

}
