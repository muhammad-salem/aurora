import { ContextProvider, ReadOnlyContextProvider, ScopeProvider } from '@ibyar/expressions';
import { PipeProvider, AsyncPipeProvider } from '../pipe/pipe.js';

const Constant: { [k: string]: any } = {
	// math
	Math: {
		E: Math.E,
		LN10: Math.LN10,
		LN2: Math.LN2,
		LOG10E: Math.LOG10E,
		LOG2E: Math.LOG2E,
		PI: Math.PI,
		SQRT1_2: Math.SQRT1_2,
		SQRT2: Math.SQRT2,

		abs: Math.abs,
		acos: Math.acos,
		asin: Math.asin,
		atan: Math.atan,
		atan2: Math.atan2,
		ceil: Math.ceil,
		cos: Math.cos,
		exp: Math.exp,
		floor: Math.floor,
		log: Math.log,
		max: Math.max,
		min: Math.min,
		pow: Math.pow,
		random: Math.random,
		round: Math.round,
		sin: Math.sin,
		sqrt: Math.sqrt,
		tan: Math.tan,
		clz32: Math.clz32,
		imul: Math.imul,
		sign: Math.sign,
		log10: Math.log10,
		log2: Math.log2,
		log1p: Math.log1p,
		expm1: Math.expm1,
		cosh: Math.cosh,
		sinh: Math.sinh,
		tanh: Math.tanh,
		acosh: Math.acosh,
		asinh: Math.asinh,
		atanh: Math.atanh,
		hypot: Math.hypot,
		trunc: Math.trunc,
		fround: Math.fround,
		cbrt: Math.cbrt,
	},
	// object
	Object,
	// number
	parseFloat,
	parseInt,
	Infinity,
	NaN,
	isNaN,
	isFinite,
	// array
	Array: {
		isArray: Array.isArray,
	},
	Symbol,
	String,
	Number,
};

const readOnlyProvider = new ReadOnlyContextProvider(Constant);
export const documentStack = new ScopeProvider([readOnlyProvider, new PipeProvider(), new AsyncPipeProvider()]);

export class BindingNotification {
	notification: Array<PropertyKey> = [];
	notify(propertyKey: PropertyKey) {
		this.notification.push(propertyKey);
		console.log(this.notification);
	}
}
export class BindingContextProvider<T extends object> implements ContextProvider {

	static contextMapping = new WeakMap<object, BindingContextProvider<object>>();

	static createOrGetProvider<T extends object>(object: T): BindingContextProvider<T> {
		if (this.contextMapping.has(object)) {
			return this.contextMapping.get(object) as BindingContextProvider<T>;
		}
		const notifier = new BindingNotification();
		const provider = new BindingContextProvider(object, notifier);
		this.contextMapping.set(object, provider);
		return provider;
	}
	constructor(protected context: T, private notifier: BindingNotification) { }
	getNotifier() {
		return this.notifier;
	}
	get(propertyKey: PropertyKey): any {
		return Reflect.get(this.context, propertyKey);
	}
	set(propertyKey: PropertyKey, value: any, receiver?: any): boolean {
		const hasSet = Reflect.set(this.context, propertyKey, value);
		this.notifier.notify(propertyKey);
		return hasSet;
	}
	has(propertyKey: PropertyKey): boolean {
		return propertyKey in this.context;
	}
	getProviderBy(): T | undefined {
		return this.context;
	}
}
