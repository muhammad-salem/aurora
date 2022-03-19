import { ReadOnlyScope, Scope, Stack } from '@ibyar/expressions';
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

const CONSTANT_SCOPE = new ReadOnlyScope(Constant);
export const documentStack = new Stack(
	[
		CONSTANT_SCOPE,
		new PipeProvider(),
		new AsyncPipeProvider()
	]
);
