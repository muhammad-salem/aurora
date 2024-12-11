import { metadataHoler, type MetadataClass, type MetadataContext } from '@ibyar/decorators';
import type { ChildOptions, OutputEventInit } from '../annotation/options.js';

export class PropertyRef {
	constructor(public modelProperty: string, protected _viewName?: string) { }
	get viewAttribute(): string {
		return this._viewName || this.modelProperty;
	}
}

export class InputPropertyRef extends PropertyRef {

}

export class OutputPropertyRef extends PropertyRef {
	constructor(modelProperty: string, viewName?: string, public options?: OutputEventInit) {
		super(modelProperty, viewName);
	}
}

export class ChildRef {
	constructor(
		public modelName: string,
		public selector: string | { new(): HTMLElement; prototype: HTMLElement } | CustomElementConstructor,
		public childOptions?: ChildOptions
	) { }
}

export class ListenerRef {
	constructor(public eventName: string, public args: string[], public modelCallbackName: string) { }
}

export class HostBindingRef {
	constructor(public modelPropertyName: string, public hostPropertyName: string) { }
}

export interface BootstrapMetadata {
	[key: string]: any;
}


export class ReflectComponents {

	static getMetaDate(constructor: MetadataClass) {
		return metadataHoler.get(constructor[Symbol.metadata]);
	}

	static addInput(metadata: MetadataContext, modelName: string, viewName: string) {
		let inputs = (metadata.inputs ?? []) as InputPropertyRef[];
		inputs = inputs.filter(i => i.modelProperty !== modelName);
		inputs.push(new InputPropertyRef(modelName, viewName));
		metadata.inputs = inputs;
	}

	static addOutput(metadata: MetadataContext, modelName: string, viewName: string, options: OutputEventInit) {
		let outputs = (metadata.outputs ?? []) as OutputPropertyRef[];
		outputs = outputs.filter(i => i.modelProperty !== modelName);
		outputs.push(new OutputPropertyRef(modelName, viewName, options));
		metadata.outputs = outputs;
	}

	static setComponentView(metadata: MetadataContext, modelName: string) {
		metadata.view = modelName;
	}

	static addViewChild(metadata: MetadataContext, modelName: string, selector: string | typeof HTMLElement | CustomElementConstructor, childOptions?: ChildOptions) {
		(metadata.viewChild ??= []).push(new ChildRef(modelName, selector, childOptions));
	}

	static addViewChildren(metadata: MetadataContext, modelName: string, selector: string | typeof HTMLElement | CustomElementConstructor) {
		(metadata.ViewChildren ??= []).push(new ChildRef(modelName, selector));
	}

	static addHostListener(metadata: MetadataContext, propertyKey: string, eventName: string, args: string[]) {
		(metadata.hostListeners ??= []).push(new ListenerRef(eventName, args, propertyKey));
	}

	static addHostBinding(metadata: MetadataContext, propertyKey: string, hostPropertyName: string) {
		(metadata.hostBindings ??= []).push(new HostBindingRef(propertyKey, hostPropertyName));
	}
}
