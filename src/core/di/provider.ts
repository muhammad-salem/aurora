import type { TypeOf } from '../utils/typeof.js';


export class InjectionToken<T> {
	constructor(public token: string) { }
}

export type Provider<T> = TypeOf<T> | InjectionToken<T>;

const EMPTY_VALUE = Symbol('EMPTY_VALUE');

export class InjectionProvider {

	private readonly types = new WeakMap<TypeOf<any>, any>();
	private readonly tokens = new WeakMap<InjectionToken<any>, any>();

	constructor(private parent?: InjectionProvider) { }

	hasToken<T>(token: InjectionToken<T>): boolean {
		return this.tokens.has(token);
	}

	hasType<T>(type: TypeOf<T>): boolean {
		return this.types.has(type);
	}

	getToken<T>(token: InjectionToken<T>): T | undefined {
		if (this.hasToken(token)) {
			return this.tokens.get(token);
		}
		return this.parent?.getToken(token);
	}

	getInstance<T>(type: TypeOf<T>): T {
		if (this.hasType(type)) {
			return this.getOrCreateInstance(type);
		}
		return this.parent?.getInstance(type)
			// will be create in the root provider, the first parent in the chain
			?? this.getOrCreateInstance(type);
	}

	setType<T>(type: TypeOf<T>, value?: T): void {
		this.types.set(type, value ?? EMPTY_VALUE);
	}

	setToken<T>(token: InjectionToken<T>, value: T): void {
		this.tokens.set(token, value);
	}

	set<T>(provider: Provider<T>, value?: T) {
		if (provider instanceof InjectionToken) {
			this.tokens.set(provider, value);
		} else {
			this.types.set(provider, value ?? EMPTY_VALUE);
		}
	}

	get<T>(provider: Provider<T>): T | undefined {
		if (provider instanceof InjectionToken) {
			return this.getToken(provider);
		}
		return this.getInstance(provider);
	}

	private getOrCreateInstance<T>(type: TypeOf<T>): T {
		let instance = this.types.get(type);
		if (instance === EMPTY_VALUE) {
			instance = new type();
			this.types.set(type, instance);
		}
		return instance;
	}

}
