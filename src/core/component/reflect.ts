import type { ChildOptions, OutputEventInit } from '../annotation/decorators.js';
import type { ComponentRef } from './component.js';

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
	constructor(public viewProperty: string, public hostPropertyName: string) { }
}

export interface BootstrapMetadata {
	[key: string]: any;
}

const AuroraBootstrap = Symbol.for('aurora:bootstrap');
const AuroraMetadata = Symbol.for('aurora:metadata');


export class ReflectComponents {

	static getOrCreateBootstrap<T extends {}>(target: Object): T {
		let bootstrap: T = Reflect.getMetadata(AuroraBootstrap, target);
		if (!bootstrap) {
			bootstrap = {} as T;
			Reflect.defineMetadata(AuroraBootstrap, bootstrap, target);
		}
		return bootstrap;
	}

	static getBootstrap<T extends {}>(target: Object): T {
		return Reflect.getMetadata(AuroraBootstrap, target);
	}

	static getComponentRef<T>(target: object): ComponentRef<T> {
		return Reflect.getMetadata(AuroraMetadata, target);
	}

	static setComponentRef<T>(target: object, componentRef: ComponentRef<T>): void {
		Reflect.defineMetadata(AuroraMetadata, componentRef, target);
	}

	static addOptional(modelProperty: Object) {
	}

	static addInput(modelProperty: Object, modelName: string, viewName: string) {
		const bootstrap: BootstrapMetadata = ReflectComponents.getOrCreateBootstrap(modelProperty);
		bootstrap.inputs = bootstrap.inputs || [];
		bootstrap.inputs.push(new InputPropertyRef(modelName, viewName));
	}

	static addOutput(modelProperty: Object, modelName: string, viewName: string, options: OutputEventInit) {
		const bootstrap: BootstrapMetadata = ReflectComponents.getOrCreateBootstrap(modelProperty);
		bootstrap.outputs = bootstrap.outputs || [];
		bootstrap.outputs.push(new OutputPropertyRef(modelName, viewName, options));
	}

	static setComponentView(modelProperty: Object, modelName: string) {
		const bootstrap: BootstrapMetadata = ReflectComponents.getOrCreateBootstrap(modelProperty);
		bootstrap.view = modelName;
	}

	static addViewChild(modelProperty: Object, modelName: string, selector: string | typeof HTMLElement | CustomElementConstructor, childOptions?: ChildOptions) {
		const bootstrap: BootstrapMetadata = ReflectComponents.getOrCreateBootstrap(modelProperty);
		bootstrap.viewChild = bootstrap.viewChild || [];
		bootstrap.viewChild.push(new ChildRef(modelName, selector, childOptions));
	}

	static addViewChildren(modelProperty: Object, modelName: string, selector: string | typeof HTMLElement | CustomElementConstructor) {
		const bootstrap: BootstrapMetadata = ReflectComponents.getOrCreateBootstrap(modelProperty);
		bootstrap.ViewChildren = bootstrap.ViewChildren || [];
		bootstrap.ViewChildren.push(new ChildRef(modelName, selector));
	}

	static addHostListener(modelProperty: Object, propertyKey: string, eventName: string, args: string[]) {
		const bootstrap: BootstrapMetadata = ReflectComponents.getOrCreateBootstrap(modelProperty);
		bootstrap.hostListeners = bootstrap.hostListeners || [];
		bootstrap.hostListeners.push(new ListenerRef(eventName, args, propertyKey));
	}

	static addHostBinding(modelProperty: Object, propertyKey: string, hostPropertyName: string) {
		const bootstrap: BootstrapMetadata = ReflectComponents.getOrCreateBootstrap(modelProperty);
		bootstrap.hostBinding = bootstrap.hostBinding || [];
		bootstrap.hostBinding.push(
			new HostBindingRef(propertyKey, hostPropertyName)
		);
	}
}
