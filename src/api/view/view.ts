import { isFormElement } from '@ibyar/element';
import { ComponentRef } from '../component/component.js';
import { HTMLComponent } from '../component/custom-element.js';
import { EventEmitter, Subscription } from '../component/events.js';
import { ToCamelCase } from '../utils/utils.js';
import { Constructable } from '../providers/injector.js';
import { TypeOf } from '../utils/utils.js';
import { baseFactoryView } from './base-view.js';
import { baseFormFactoryView } from './form-view.js';

/**
 * 
 * @param modelClass 
 * @param componentRef 
 */
export function initCustomElementView<T extends Object>(modelClass: TypeOf<T>, componentRef: ComponentRef<T>): TypeOf<HTMLComponent<T>> {
	const htmlParent = componentRef.extend.classRef as TypeOf<HTMLElement>;
	let viewClass: TypeOf<HTMLComponent<T>>;
	if (componentRef.extend.name) {
		if (isFormElement(componentRef.extend.name)) {
			viewClass = class extends baseFormFactoryView<T>(htmlParent) {
				constructor() {
					super(componentRef, modelClass);
				}
			};
		} else /*if (htmlParent !== HTMLElement)*/ {
			viewClass = class extends baseFactoryView<T>(htmlParent) {
				constructor() {
					super(componentRef, modelClass);
				}
			};
		}
	} else {
		viewClass = class extends baseFactoryView<T>(HTMLElement) {
			constructor() {
				super(componentRef, modelClass);
			}
		};
	}

	componentRef.inputs.forEach((input) => {
		let parentProperty = Object.getOwnPropertyDescriptor(
			htmlParent.prototype,
			input.viewAttribute
		);
		Object.defineProperty(viewClass.prototype, input.viewAttribute, {
			get(): any {
				return this._model[input.modelProperty] || parentProperty?.get?.call(this);
			},
			set(value: any) {
				this._model[input.modelProperty] = value;
				// this._setAttributeNative(input.viewAttribute, value);
				// this._model.emitChangeModel(input.modelProperty);
				if (parentProperty?.set) {
					parentProperty.set.call(this, value);
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
			// get(): EventEmitter<any> {
			// 	// return this._model[output.modelProperty];
			// },
			get(): Function | undefined {
				// return this._model[output.modelProperty];
				return eventListener;
			},
			set(event: string | Function): void {
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
	Object.defineProperty(viewClass, 'observedAttributes', {
		get() {
			return componentRef.inputs.map(input => input.viewAttribute);
		}
	});
	// https://html.spec.whatwg.org/multipage/custom-elements.html#custom-elements-face-example
	if (false) {
		Object.defineProperty(viewClass, 'formAssociated', {
			get() {
				return true;
			}
		});
	}
	addViewToModelClass<T>(modelClass, componentRef.selector, viewClass);
	return viewClass;
}

export type ComponentModelClass = Constructable & { [key: string]: string } & { component: { [key: string]: string } };

export function isComponentModelClass(target: Constructable): target is ComponentModelClass {
	return Reflect.has(target, 'component');
}

export function addViewToModelClass<T>(modelClass: TypeOf<T>, selector: string, viewClass: TypeOf<HTMLComponent<T>>) {
	const viewClassName = selector
		.split('-')
		.map(name => name.replace(/^\w/, char => char.toUpperCase()))
		.join('');
	Object.defineProperty(viewClass, 'name', { value: viewClassName });
	Object.defineProperty(modelClass, viewClassName, { value: viewClass });

	if (!isComponentModelClass(modelClass)) {
		Reflect.set(modelClass, 'component', {});
	}

	if (isComponentModelClass(modelClass)) {
		modelClass.component[selector] = viewClassName;
	}

}

export function ComponentView<T>(modelClass: TypeOf<T>, selector?: string): TypeOf<HTMLComponent<T>> | undefined {
	if (isComponentModelClass(modelClass)) {
		let viewClassName: string;
		if (selector) {
			viewClassName = modelClass.component[selector];
			if (!viewClassName) {
				throw new Error(`${modelClass.name} doesn't have ${selector} as view`);
			}
		} else {
			viewClassName = Object.keys(modelClass.component)[0];
		}
		return Reflect.get(modelClass, viewClassName);
	}
}
