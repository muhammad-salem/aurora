import { isHTMLComponent } from '../component/custom-element.js';

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
	const subject1 = defineModel<object>(isHTMLComponent(obj1) ? obj1._model : obj1);
	const subject1Callback = (source: any[]) => {
		callback(source);
		if (obj2 && obj2PropName) {
			let subject2 = defineModel<object>(isHTMLComponent(obj2) ? obj2._model : obj2);
			if (obj2PropName && !source.includes(subject2)) {
				subject2.emitChangeModel(obj2PropName, source);
			}
		}
	};
	const subject1DestroyCallback = (source: any[]) => {
		const subIndex = subject1.__observable[obj1PropName].indexOf(subject1Callback);
		subject1.__observable[obj1PropName].splice(subIndex, 1);
	};

	subject1.subscribeModel(obj1PropName, subject1Callback);
	subject1.subscribeModel('destroy', subject1DestroyCallback);
}

export function addChangeListener(observableModel: {}, propertyName: string, callback: () => void) {
	const subject1 = defineModel<object>(isHTMLComponent(observableModel) ? observableModel._model : observableModel);

	const subject1Callback = (source: any[]) => {
		callback();
	};
	const subject1DestroyCallback = (source: any[]) => {
		const subIndex = subject1.__observable[propertyName].indexOf(subject1Callback);
		subject1.__observable[propertyName].splice(subIndex, 1);
	};

	subject1.subscribeModel(propertyName, subject1Callback);
	subject1.subscribeModel('destroy', subject1DestroyCallback);
}

export function subscribe2way(obj1: {}, obj1PropName: string, callback1: SourceFollowerCallback, obj2: {}, obj2PropName: string, callback2: SourceFollowerCallback) {
	const subject1: Model = defineModel(isHTMLComponent(obj1) ? obj1._model : obj1);
	const subject2: Model = defineModel(isHTMLComponent(obj2) ? obj2._model : obj2);

	const subject1Callback = (source: any[]) => {
		callback1(source);
		if (!source.includes(subject2)) {
			subject2.emitChangeModel(obj2PropName, source);
		}
	};
	const subject1DestroyCallback = (source: any[]) => {
		const subIndex = subject1.__observable[obj1PropName].indexOf(subject1Callback);
		subject1.__observable[obj1PropName].splice(subIndex, 1);
	};

	subject1.subscribeModel(obj1PropName, subject1Callback);
	subject1.subscribeModel('destroy', subject1DestroyCallback);

	const subject2Callback = (source: any[]) => {
		callback2(source);
		if (!source.includes(subject1)) {
			subject1.emitChangeModel(obj1PropName, source);
		}
	};
	const subject2DestroyCallback = (source: any[]) => {
		const subIndex = subject2.__observable[obj2PropName].indexOf(subject1Callback);
		subject2.__observable[obj2PropName].splice(subIndex, 1);
	};

	subject2.subscribeModel(obj2PropName, subject2Callback);
	subject2.subscribeModel('destroy', subject2DestroyCallback);
}
