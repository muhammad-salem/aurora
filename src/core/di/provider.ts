import type { AbstractType, Type } from '../utils/typeof.js';


export class InjectionToken<T> {
	constructor(public token: string) { }
}

export type Provider<T> = Type<T> | AbstractType<T> | InjectionToken<T>;

const REQUIRE_INIT = Symbol('REQUIRE_INIT');

export class InjectionProvider {

	private readonly types = new WeakMap<Type<any> | AbstractType<any>, any>();
	private readonly tokens = new WeakMap<InjectionToken<any>, any>();

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
		return this.tokens.get(token);
	}

	getInstance<T>(type: Type<any> | AbstractType<any>): T {
		let instance = this.types.get(type);
		if (instance === REQUIRE_INIT) {
			instance = new (type as Type<any>)();
			this.types.set(type, instance);
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
			const provider = this.parent?.hasToken(typeOrToken) || this;
			provider.setToken(typeOrToken, value);
		} else {
			const provider = this.parent?.hasType(typeOrToken) || this;
			provider.setType(typeOrToken, value ?? REQUIRE_INIT as unknown as T);
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
