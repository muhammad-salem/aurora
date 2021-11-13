import type { TypeOf } from '../utils/typeof.js';
import { isFormElement } from '@ibyar/elements';
import { ComponentRef } from '../component/component.js';
import { HTMLComponent } from '../component/custom-element.js';
import { EventEmitter, Subscription } from '../component/events.js';
import { ToCamelCase } from '../utils/utils.js';
import { Constructable } from '../providers/injector.js';
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
	const viewClassName = buildViewClassNameFromSelector(componentRef.selector);
	const htmlViewClassName = `HTML${viewClassName}Element`;
	const parentClass = componentRef.extend.name
		? (isFormElement(componentRef.extend.name)
			? baseFormFactoryView<T>(htmlParent)
			: baseFactoryView<T>(htmlParent)
		)
		: baseFactoryView<T>(HTMLElement);
	viewClass = ({
		[htmlViewClassName]: class extends parentClass { constructor() { super(componentRef, modelClass); } }
	})[htmlViewClassName];

	componentRef.inputs.forEach((input) => {
		const parentProperty = Object.getOwnPropertyDescriptor(
			htmlParent.prototype,
			input.viewAttribute
		);
		Object.defineProperty(viewClass.prototype, input.viewAttribute, {
			get(this: HTMLComponent<T>): any {
				return this._proxyModel[input.modelProperty] || parentProperty?.get?.call(this);
			},
			set(this: HTMLComponent<{ [key: string]: any; }>, value: any) {
				this._modelScope.set(input.modelProperty, value);
				// this._model[input.modelProperty] = value;
				// this._proxyModel[input.modelProperty] = value;
				parentProperty?.set?.call(this, value);
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
	addViewToModelClass<T>(modelClass, componentRef.selector, viewClass, htmlViewClassName);
	if (!Reflect.has(window, htmlViewClassName)) {
		Reflect.set(window, htmlViewClassName, viewClass);
	}
	return viewClass;
}

export type ComponentModelClass = Constructable & { [key: string]: string } & { component: { [key: string]: string } };

export function isComponentModelClass(target: Constructable): target is ComponentModelClass {
	return Reflect.has(target, 'component');
}

export function addViewToModelClass<T extends object>(modelClass: TypeOf<T>, selector: string, viewClass: TypeOf<HTMLComponent<T>>, htmlViewClassName: string) {
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

export function getComponentView<T extends object>(modelClass: TypeOf<T>, selector?: string): TypeOf<HTMLComponent<T>> | undefined {
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
