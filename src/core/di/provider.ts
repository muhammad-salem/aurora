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

	hasToken<T>(token: InjectionToken<T>): InjectionProvider | false {
		return this.tokens.has(token) ? this : false;
	}

	hasType<T>(type: TypeOf<T>): InjectionProvider | false {
		return this.types.has(type) ? this : false;
	}

	getToken<T>(token: InjectionToken<T>): T | undefined {
		return this.tokens.get(token);
	}

	getInstance<T>(type: TypeOf<T>): T {
		let instance = this.types.get(type);
		if (instance === EMPTY_VALUE) {
			instance = new type();
			this.types.set(type, instance);
		}
		return instance;
	}

	setType<T>(type: TypeOf<T>, value?: T): void {
		this.types.set(type, value ?? EMPTY_VALUE);
	}

	setToken<T>(token: InjectionToken<T>, value: T): void {
		this.tokens.set(token, value);
	}

	provide<T>(typeOrToken: Provider<T>, value?: T) {
		if (typeOrToken instanceof InjectionToken) {
			const provider = this.parent?.hasToken(typeOrToken) || this;
			provider.setToken(typeOrToken, value);
		} else {
			const provider = this.parent?.hasType(typeOrToken) || this;
			provider.setType(typeOrToken, value ?? EMPTY_VALUE as unknown as T);
		}
	}

	inject<T>(typeOrToken: Provider<T>): T | undefined {
		if (typeOrToken instanceof InjectionToken) {
			const provider = this.parent?.hasToken(typeOrToken) || this;
			return provider.getToken(typeOrToken);
		}
		const provider = this.parent?.hasType(typeOrToken) || this;
		return provider.getInstance(typeOrToken);
	}

	clear<T>(typeOrToken: Provider<T>): void {
		if (typeOrToken instanceof InjectionToken) {
			const provider = this.parent?.hasToken(typeOrToken) || this;
			provider.tokens.delete(typeOrToken);
		} else {
			const provider = this.parent?.hasType(typeOrToken) || this;
			provider.types.delete(typeOrToken);
		}
	}

}
