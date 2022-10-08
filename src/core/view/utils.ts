import type { HTMLComponent } from '../component/custom-element.js';
import type { Constructable } from '../providers/injector.js';
import type { TypeOf } from '../utils/typeof.js';
import type { ComponentModelClass } from './view.js';

export function isComponentModelClass(target: Constructable): target is ComponentModelClass {
	return Reflect.has(target, 'component');
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
	return;
}
