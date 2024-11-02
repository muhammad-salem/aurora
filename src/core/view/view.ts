import type { Type } from '../utils/typeof.js';
import { MetadataClass, Metadata } from '@ibyar/decorators';
import { getReactiveNode, Signal } from '@ibyar/expressions';
import { getAllAttributes } from '@ibyar/elements';
import { ComponentRef } from '../component/component.js';
import { HTMLComponent } from '../component/custom-element.js';
import { EventEmitter, Subscription } from '../component/events.js';
import { ToCamelCase } from '../utils/utils.js';
import { baseFactoryView } from './base-view.js';
import { baseFormFactoryView } from './form-view.js';
import { isComponentModelClass } from './utils.js';

const FACTORY_CACHE = new WeakMap<Type<HTMLElement>, Type<HTMLComponent<any>>>();

/**
 * 
 * @param modelClass 
 * @param componentRef 
 */
export function initCustomElementView<T extends Object>(modelClass: MetadataClass<T>, componentRef: ComponentRef<T>): MetadataClass<HTMLComponent<T>> {
	const htmlParent = componentRef.extend.classRef as Type<HTMLElement>;
	const viewClassName = buildViewClassNameFromSelector(componentRef.selector);
	const htmlViewClassName = `HTML${viewClassName}Element`;

	let parentClass: Type<HTMLComponent<T>>;
	if (componentRef.extendCustomElement) {
		parentClass = componentRef.extend.classRef as Type<HTMLComponent<T>>;
	} else {
		if (FACTORY_CACHE.has(htmlParent)) {
			parentClass = FACTORY_CACHE.get(htmlParent) as Type<HTMLComponent<T>>;
		} else {
			parentClass = componentRef.formAssociated ? baseFormFactoryView<T>(htmlParent) : baseFactoryView<T>(htmlParent);
			FACTORY_CACHE.set(htmlParent, parentClass);
		}
	}

	const viewClass = ({
		[htmlViewClassName]: @Metadata() class extends parentClass {
			public static allAttributes: string[] = [];
			public static disabledFeatures: string[] = [];
			public static observedAttributes: string[] = [];
			constructor(optionalComponentRef?: ComponentRef<T>, modelConstructor?: Type<T>) {
				super(optionalComponentRef ?? componentRef, modelConstructor ?? modelClass);
			}
		}
	})[htmlViewClassName];

	componentRef.inputs.forEach((input) => {
		Object.defineProperty(viewClass.prototype, input.viewAttribute, {
			get(this: HTMLComponent<T>): any {
				const value = this._modelScope.get(input.modelProperty);
				const signal = getReactiveNode(value);
				if (signal) {
					return signal.get();
				}
				return value;
			},
			set(this: HTMLComponent<{ [key: string]: any; }>, value: any) {
				const model = this._modelScope.get(input.modelProperty);
				const signal = getReactiveNode(model);
				if (signal instanceof Signal) {
					signal.set(value);
				} else {
					this._modelScope.set(input.modelProperty, value);
				}
			},
			enumerable: true,
		});
	});

	componentRef.outputs.forEach(output => {
		Object.defineProperty(viewClass.prototype, output.viewAttribute, {
			get(): EventEmitter<any> {
				return this._model[output.modelProperty];
			},
			enumerable: true
		});
		let eventListener: Function | undefined;
		let subscription: Subscription<any>;
		Object.defineProperty(viewClass.prototype, 'on' + ToCamelCase(output.viewAttribute), {
			get(): Function | undefined {
				return eventListener;
			},
			set(this: HTMLComponent<T>, event: string | Function): void {
				if (!event) {
					if (subscription) {
						subscription.unsubscribe();
						eventListener = undefined;
					}
				}
				if (typeof event === 'string') {
					if (event.endsWith('()')) {
						event = event.substring(0, event.length - 2);
					}
					event = Reflect.get(window, event);
				}
				eventListener = event as Function;
				subscription = (this._model[output.modelProperty] as EventEmitter<any>).subscribe(event);
			},
			enumerable: true
		});
	});

	componentRef.inputs.map(input => input.modelProperty)
		.concat(componentRef.outputs.map(output => output.modelProperty))
		.concat(componentRef.hostBindings.map(host => host.hostPropertyName))
		.concat(componentRef.viewChild.map(child => child.modelName))
		.filter(modelName => !(modelName in modelClass.prototype))
		.forEach(modelName => modelClass.prototype[modelName] = undefined);

	const defaultAttributes = getAllAttributes(componentRef.extend.name);
	const observedAttributes = componentRef.inputs.map(input => input.viewAttribute)
		.concat(componentRef.outputs.map(output => 'on' + ToCamelCase(output.viewAttribute)));
	if (componentRef.formAssociated && !observedAttributes.includes('value')) {
		observedAttributes.push('value');
	}

	viewClass.allAttributes.push(...defaultAttributes.concat(observedAttributes));
	viewClass.observedAttributes.push(...observedAttributes);
	if (Array.isArray(componentRef.disabledFeatures)) {
		viewClass.disabledFeatures.push(...componentRef.disabledFeatures);
	}
	addViewToModelClass<T>(modelClass, componentRef.selector, viewClass, htmlViewClassName);
	if (!Reflect.has(window, htmlViewClassName)) {
		Reflect.set(window, htmlViewClassName, viewClass);
	}
	return viewClass as Type<HTMLComponent<T>> as MetadataClass;
}

export type ComponentModelClass =
	MetadataClass
	& { [key: string]: string }
	& { component: { [key: string]: string } }
	& { [key: string]: Type<HTMLComponent<any>> };

export function addViewToModelClass<T extends object>(modelClass: MetadataClass<T>, selector: string, viewClass: Type<HTMLComponent<T>>, htmlViewClassName: string) {
	Object.defineProperty(modelClass, htmlViewClassName, { value: viewClass });

	if (!isComponentModelClass(modelClass)) {
		Reflect.set(modelClass, 'component', {});
	}

	if (isComponentModelClass(modelClass)) {
		modelClass.component[selector] = htmlViewClassName;
	}
}

export function buildViewClassNameFromSelector(selector: string) {
	return selector
		.split('-')
		.map(name => name.replace(/^\w/, char => char.toUpperCase()))
		.join('');
}
