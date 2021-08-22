import { isHTMLComponent } from '../component/custom-element';

export type SourceFollowerCallback = (stack: any[]) => void;
export interface Model {
	__observable: { [key: string]: Function[] };
	subscribeModel(eventName: string, callback: SourceFollowerCallback): void;
	emitChangeModel(eventName: string, source?: any[]): void;
}

export function isModel(object: any): object is Model {
	return object.__observable
		&& object.subscribeModel
		&& object.emitChangeModel;
}

export function defineModel<T>(object: T): Model & T {
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
	return object as Model & T;
}

export function subscribe1way(obj1: {}, obj1PropName: string, callback: SourceFollowerCallback, obj2?: {}, obj2PropName?: string) {
	let subject1 = defineModel<object>(isHTMLComponent(obj1) ? obj1._model : obj1);
	subject1.subscribeModel(obj1PropName, (stack: any[]) => {
		callback(stack);
		if (obj2 && obj2PropName) {
			let subject2 = defineModel<object>(isHTMLComponent(obj2) ? obj2._model : obj2);
			if (obj2PropName && !stack.includes(subject2)) {
				subject2.emitChangeModel(obj2PropName, stack);
			}
		}
	});
}

export function addChangeListener(observableModel: {}, propertyName: string, callback: () => void) {
	let subject1 = defineModel<object>(isHTMLComponent(observableModel) ? observableModel._model : observableModel);
	subject1.subscribeModel(propertyName, (stack: any[]) => {
		callback();
	});
}

export function subscribe2way(obj1: {}, obj1PropName: string, callback1: SourceFollowerCallback, obj2: {}, obj2PropName: string, callback2: SourceFollowerCallback) {
	let subject1 = defineModel(isHTMLComponent(obj1) ? obj1._model : obj1);
	let subject2 = defineModel(isHTMLComponent(obj2) ? obj2._model : obj2);
	subject1.subscribeModel(obj1PropName, (source: any[]) => {
		callback1(source);
		if (!source.includes(subject2)) {
			subject2.emitChangeModel(obj2PropName, source);
		}
	});
	subject2.subscribeModel(obj2PropName, (stack: any[]) => {
		callback2(stack);
		if (!stack.includes(subject1)) {
			subject1.emitChangeModel(obj1PropName, stack);
		}
	});
}
