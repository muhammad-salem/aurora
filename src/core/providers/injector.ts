
export interface Constructable<T = any> {
	new(...params: any[]): T;
}

export class Injector {

	private dependencyInjectionMap = new Map();

	constructor() { }

	getInstance<T>(contr: Constructable<T>): T {
		const instance = this.constructObject(contr);
		return instance;
	}

	private constructObject(constructor: Constructable) {
		let currentInstance = this.dependencyInjectionMap.get(constructor);
		if (currentInstance) return currentInstance;

		const params: Constructable[] =
			Reflect.getMetadata('design:paramtypes', constructor);
		// We need to init each constructor function into it's instance
		if (params) {
			const argumentsInstances = params.map((paramter) =>
				this.constructObject(paramter)
			);
			currentInstance = new constructor(...argumentsInstances);
		} else {
			currentInstance = new constructor();
		}
		this.dependencyInjectionMap.set(constructor, currentInstance);
		return currentInstance;
	}
}

export const dependencyInjector: Injector = new Injector();
