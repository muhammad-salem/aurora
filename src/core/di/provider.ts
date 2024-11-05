import type { AbstractType, Type } from '../utils/typeof.js';


export class InjectionToken<T> {
	constructor(public token: string) { }

	withType<V>(): InjectionToken<V> {
		return this;
	}
}

export type Provider<T> = Type<T> | AbstractType<T> | InjectionToken<T>;

const REQUIRE_INIT = Symbol('REQUIRE_INIT');

export class InjectionProvider {

	private readonly types = new Map<Type<any> | AbstractType<any>, any>();
	private readonly tokens = new Map<InjectionToken<any>, any>();

	constructor(private parent?: InjectionProvider) { }

	fork(): InjectionProvider {
		return new InjectionProvider(this);
	}

	hasToken<T>(token: InjectionToken<T>): InjectionProvider | false {
		return this.tokens.has(token) ? this : false;
	}

	hasType<T>(type: Type<any> | AbstractType<any>): InjectionProvider | false {
		return this.types.has(type) ? this : false;
	}

	getToken<T>(token: InjectionToken<T>): T | undefined {
		let value = this.tokens.get(token);
		if (value === undefined && this.parent) {
			value = this.parent.getToken(token);
		}
		return value;
	}

	getInstance<T>(type: Type<any> | AbstractType<any>): T {
		let instance = this.types.get(type);
		if (instance === REQUIRE_INIT) {
			instance = new (type as Type<any>)();
			this.types.set(type, instance);
		} else if (instance === undefined && this.parent) {
			instance = this.parent.getInstance(type);
		}
		return instance;
	}

	setType<T>(type: Type<any> | AbstractType<any>, value?: T): void {
		this.types.set(type, value ?? REQUIRE_INIT);
	}

	setToken<T>(token: InjectionToken<T>, value: T): void {
		this.tokens.set(token, value);
	}

	provide<T>(typeOrToken: Provider<T>, value?: T) {
		if (typeOrToken instanceof InjectionToken) {
			this.setToken(typeOrToken, value);
		} else {
			this.setType(typeOrToken, value ?? REQUIRE_INIT as unknown as T);
		}
	}

	inject<T>(typeOrToken: Provider<T>): T | undefined {
		if (typeOrToken instanceof InjectionToken) {
			return this.getToken(typeOrToken);
		}
		return this.getInstance(typeOrToken);
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
