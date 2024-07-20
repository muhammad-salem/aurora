import { DomElementNode, DomFragmentNode, htmlParser } from '@ibyar/elements/node.js';
import { HostBindingRef, ListenerRef } from '../component/reflect.js';
import { buildExpressionNodes } from './expression.js';

export type ViewBindingOption = {
	prototype: Record<PropertyKey, any>;
	hostBindings?: HostBindingRef[];
	hostListeners?: ListenerRef[];
	selector?: string;
};

export type HostNode = {
	host?: DomElementNode;
	window?: DomElementNode;
	template?: DomElementNode[];
};

export function createOutputs(Listeners?: ListenerRef[]) {
	return Listeners?.map(
		listener => `(${listener.eventName})="${listener.modelCallbackName}(${listener.args.join(', ')})"`
	).join(' ') ?? ''
}

export function parseHostNode(option: ViewBindingOption): HostNode {
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
		const hostOutputs = createOutputs(hostListeners);
		const selector = option.selector ?? 'div';
		const hostTemplate = `<${selector} ${inputs} ${hostOutputs}></${selector}>`;
		result.host = htmlParser.toDomRootNode(hostTemplate) as DomElementNode;
		buildExpressionNodes(result.host);
	}

	if (windowListeners.length) {
		const windowOutputs = createOutputs(windowListeners);
		const windowTemplate = `<window ${windowOutputs}></window>`;
		result.window = htmlParser.toDomRootNode(windowTemplate) as DomElementNode;
		buildExpressionNodes(result.window);
	}

	const templateHosts = Object.keys(templateListeners);
	if (templateHosts.length) {
		const template = templateHosts.map(host => {
			const hostOutputs = createOutputs(templateListeners[host]);
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
