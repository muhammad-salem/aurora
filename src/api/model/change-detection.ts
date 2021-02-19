import { isHTMLComponent } from '../component/custom-element.js';

export interface Model {
	__observable: { [key: string]: Function[] };
	subscribeModel(eventName: string, callback: Function): void;
	emitChangeModel(eventName: string, source?: any[]): void;
}

export function isModel(object: any): object is Model {
	return object.__observable
		&& object.subscribeModel
		&& object.emitChangeModel;
}

export function defineModel(object: any): Model {
	if (typeof object !== 'object') {
		throw new Error(`typeof ${typeof object} can't be a subscription model`);
	}
	if (isModel(object)) {
		return object;
	}
	const observable: { [key: string]: Function[] } = {};
	Object.defineProperty(object, '__observable', { value: observable });
	Object.defineProperty(object, 'subscribeModel', {
		value: (eventName: string, callback: Function) => {
			if (typeof callback !== 'function') {
				return;
			}
			observable[eventName] = observable[eventName] || [];
			observable[eventName].push(callback);
		}
	});
	Object.defineProperty(object, 'emitChangeModel', {
		value: (eventName: string, source?: any[]) => {
			if (!source) {
				source = [object];
			} else {
				source.push(object);
			}
			let calls = Object.keys(observable)
				.filter(key => key.startsWith(eventName) || eventName.startsWith(key));
			calls.forEach(key => {
				observable[key].forEach(callback => callback.call(object, source));
			});
		}
	});
	return object as Model;
}

export type SourceFollowerCallback = (stack: any[]) => void;

export function subscribe1way(obj1: {}, obj1PropName: string, obj2: {}, obj2PropName: string, callback?: SourceFollowerCallback) {
	let subject1 = defineModel(isHTMLComponent(obj1) ? obj1._model : obj1);
	let subject2 = defineModel(isHTMLComponent(obj2) ? obj2._model : obj2);
	subject1.subscribeModel(obj1PropName, (stack: any[]) => {
		if (callback) {
			callback(stack);
		}
		// updateValue(obj1, obj1ChildName, obj2, obj2ChildName);
		if (!stack.includes(subject2) && isModel(subject2)) {
			subject2.emitChangeModel(obj2PropName, stack);
		}
	});
}

export function subscribe2way(obj1: {}, obj1PropName: string, obj2: {}, obj2PropName: string, callback1?: SourceFollowerCallback, callback2?: SourceFollowerCallback) {
	let subject1 = defineModel(isHTMLComponent(obj1) ? obj1._model : obj1);
	let subject2 = defineModel(isHTMLComponent(obj2) ? obj2._model : obj2);
	subject1.subscribeModel(obj1PropName, (source: any[]) => {
		if (callback1) {
			callback1(source);
		}
		// updateValue(obj1, obj1ChildName, obj2, obj2ChildName);
		if (!source.includes(subject2) && isModel(subject2)) {
			subject2.emitChangeModel(obj2PropName, source);
		}
	});
	subject2.subscribeModel(obj2PropName, (stack: any[]) => {
		if (callback2) {
			callback2(stack);
		}
		// updateValue(obj2, obj2ChildName, obj1, obj1ChildName);
		if (!stack.includes(subject1) && isModel(subject1)) {
			subject1.emitChangeModel(obj1PropName, stack);
		}
	});
}
