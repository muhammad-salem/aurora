import { ScopeProvider, ScopedContext, ReadOnlyScopedContext } from '@ibyar/expressions/api';
import { PipeTransform } from '../pipe/pipe.js';
import { ClassRegistryProvider } from '../providers/provider.js';

// const CachedPipes: Map<string, Function> = new Map();
class PipeScopeProvider extends ReadOnlyScopedContext<Map<string, Function>> {
	constructor() {
		super(new Map());
	}
	has(pipeName: string): boolean {
		if (this.context.has(pipeName)) {
			return true;
		}
		const pipeRef = ClassRegistryProvider.getPipe<PipeTransform<any, any>>(pipeName);
		return pipeRef ? true : false;
	}
	get(pipeName: string): any {
		let transformFunc: Function | undefined;
		if (transformFunc = this.context.get(pipeName)) {
			return transformFunc;
		}
		const pipeRef = ClassRegistryProvider.getPipe<PipeTransform<any, any>>(pipeName);
		if (pipeRef) {
			const pipe = new pipeRef.modelClass();
			transformFunc = pipe.transform.bind(pipe);
			this.context.set(pipeRef.name, transformFunc);
			return transformFunc;
		}
		return void 0;
	}
}

export class DOMStack extends ScopeProvider {
	static pipeProvider: ScopedContext = new PipeScopeProvider();
	findContext(propertyKey: PropertyKey): ScopedContext {
		if (DOMStack.pipeProvider.has(propertyKey)) {
			return DOMStack.pipeProvider;
		}
		return super.findContext(propertyKey);
	}
}

export const documentStack = new DOMStack();

const Constant = {
	// math
	Math,
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
	isArray: Array.isArray,
	// symbol
	Symbol

};

documentStack.addReadOnlyProvider(Constant);
