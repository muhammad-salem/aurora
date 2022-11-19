import type { TypeOf } from '../utils/typeof.js';
import { getAllAttributes } from '@ibyar/elements';
import { ComponentRef } from '../component/component.js';
import { HTMLComponent } from '../component/custom-element.js';
import { EventEmitter, Subscription } from '../component/events.js';
import { ToCamelCase } from '../utils/utils.js';
import { Constructable } from '../providers/injector.js';
import { baseFactoryView } from './base-view.js';
import { baseFormFactoryView } from './form-view.js';
import { isComponentModelClass } from './utils.js';

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
	const parentClass = componentRef.formAssociated ? baseFormFactoryView<T>(htmlParent) : baseFactoryView<T>(htmlParent);
	viewClass = ({
		[htmlViewClassName]: class extends parentClass { constructor() { super(componentRef, modelClass); } }
	})[htmlViewClassName];

	componentRef.inputs.forEach((input) => {
		Object.defineProperty(viewClass.prototype, input.viewAttribute, {
			get(this: HTMLComponent<T>): any {
				return this._modelScope.get(input.modelProperty);
			},
			set(this: HTMLComponent<{ [key: string]: any; }>, value: any) {
				this._modelScope.set(input.modelProperty, value);
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
	Reflect.set(viewClass, 'observedAttributes', observedAttributes);
	Reflect.set(viewClass, 'allAttributes', defaultAttributes.concat(observedAttributes));
	addViewToModelClass<T>(modelClass, componentRef.selector, viewClass, htmlViewClassName);
	if (!Reflect.has(window, htmlViewClassName)) {
		Reflect.set(window, htmlViewClassName, viewClass);
	}
	return viewClass;
}

export type ComponentModelClass =
	Constructable
	& { [key: string]: string }
	& { component: { [key: string]: string } }
	& { [key: string]: TypeOf<HTMLComponent<any>> };

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
