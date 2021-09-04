
export type ScopeType = 'block' | 'function' | 'class' | 'module' | 'global';

export interface Scope<T> {
	type: ScopeType;

	/**
	 * get value of `propertyKey` in current context
	 * @param propertyKey 
	 */
	get(propertyKey: PropertyKey): any;

	/**
	 * set the value of `propertyKey` in current context, could be instilled with `value`.
	 * @param propertyKey 
	 * @param value 
	 * @param receiver 
	 */
	set(propertyKey: PropertyKey, value?: any, receiver?: any): boolean;

	/**
	 * is current context has `propertyKey` in hash map keys
	 * @param propertyKey 
	 */
	has(propertyKey: PropertyKey): boolean;

	/**
	 * get current context object of this scope
	 */
	getContext(): T | undefined;

	/**
	 * get value of `propertyKey` in current context
	 * @param propertyKey 
	 */
	getScope<V extends object>(propertyKey: PropertyKey): Scope<V> | undefined;
}

export class Scope<T extends object> implements Scope<T> {
	static for<T extends object>(context: T, type: ScopeType) {
		return new Scope(context, type);
	}
	static blockScopeFor<T extends object>(context: T) {
		return new Scope(context, 'block');
	}
	static functionScopeFor<T extends object>(context: T) {
		return new Scope(context, 'function');
	}
	static blockScope<T extends object>() {
		return new Scope({} as T, 'block');
	}
	static functionScope<T extends object>() {
		return new Scope({} as T, 'function');
	}
	protected scopeMap = new Map<PropertyKey, Scope<any>>();
	constructor(protected context: T, public type: ScopeType) { }
	get(propertyKey: PropertyKey): any {
		return Reflect.get(this.context, propertyKey);
	}
	set(propertyKey: PropertyKey, value: any, receiver?: any): boolean {
		return Reflect.set(this.context, propertyKey, value);
	}
	has(propertyKey: PropertyKey): boolean {
		return propertyKey in this.context;
	}
	getContext(): T | undefined {
		return this.context;
	}
	getScope<V extends object>(propertyKey: PropertyKey): Scope<V> | undefined {
		let scope = this.scopeMap.get(propertyKey);
		if (scope) {
			return scope;
		}
		const scopeContext = this.get(propertyKey);
		if (typeof scopeContext === 'undefined') {
			return;
		}
		scope = new Scope(scopeContext, 'block');
		this.scopeMap.set(propertyKey, scope);
		return scope;
	}
}

export class ReadOnlyScope<T extends object> extends Scope<T> {
	static for<T extends object>(context: T, type: ScopeType) {
		return new ReadOnlyScope(context, type);
	}
	static blockScopeFor<T extends object>(context: T) {
		return new ReadOnlyScope(context, 'block');
	}
	static blockScope<T extends object>() {
		return new ReadOnlyScope({} as T, 'block');
	}
	set(propertyKey: PropertyKey, value: any, receiver?: any): boolean {
		// do nothing
		return false;
	}
}

class Subscription<T> {
	private othersSubscription: Subscription<any>[];
	constructor(private observer: ValueChangeObserver<T>) { }
	add(subscription: Subscription<any>) {
		if (!this.othersSubscription) {
			this.othersSubscription = [];
		}
		this.othersSubscription.push(subscription);
	}
	unsubscribe(): void {
		this.observer.remove(this);
		if (this.othersSubscription) {
			this.othersSubscription.forEach((subscription) => {
				subscription.unsubscribe();
			});
		}
	}
}

export class ValueChangeObserver<T> {
	private subscribers: Map<Subscription<T>, (propertyKey: PropertyKey, oldValue: any, newValue: any) => void> = new Map();
	constructor(name?: string) { }
	emit(propertyKey: PropertyKey, oldValue: any, newValue: any): void {
		this.subscribers.forEach((subscribe) => {
			try {
				subscribe(propertyKey, oldValue, newValue);
			} catch (error) {
				console.error('error: handling event', error);
			}
		});
	}
	subscribe(callback: (propertyKey: PropertyKey, oldValue: any, newValue: any) => void): Subscription<T> {
		const subscription: Subscription<T> = new Subscription(this);
		this.subscribers.set(subscription, callback);
		return subscription;
	}

	remove(subscription: Subscription<T>) {
		this.subscribers.delete(subscription);
	}
}


export class ReactiveScope<T extends object> extends Scope<T> {
	static for<T extends object>(context: T, type: ScopeType) {
		return new ReactiveScope(context, type);
	}
	static blockScopeFor<T extends object>(context: T) {
		return new ReactiveScope(context, 'block');
	}
	static functionScopeFor<T extends object>(context: T) {
		return new ReactiveScope(context, 'function');
	}
	static blockScope<T extends object>() {
		return new ReactiveScope({} as T, 'block');
	}
	static functionScope<T extends object>() {
		return new ReactiveScope({} as T, 'function');
	}
	private observer: ValueChangeObserver<T>;
	constructor(context: T, type: ScopeType, protected name?: PropertyKey, observer?: ValueChangeObserver<T>) {
		super(context, type);
		if (observer) {
			this.observer = observer;
		} else {
			this.observer = new ValueChangeObserver(name as string);
		}
	}
	set(propertyKey: PropertyKey, newValue: any, receiver?: any): boolean {
		const oldValue = Reflect.get(this.context, propertyKey);
		const result = Reflect.set(this.context, propertyKey, newValue);
		if (result) {
			this.observer?.emit(propertyKey, oldValue, newValue);
		}
		return result;
	}
	getScope<V extends object>(propertyKey: PropertyKey): ReactiveScope<V> | undefined {
		let scope = this.scopeMap.get(propertyKey);
		if (scope) {
			return scope as ReactiveScope<V>;
		}
		const scopeContext = this.get(propertyKey);
		if (typeof scopeContext === 'undefined') {
			return;
		}
		const childName = this.getEventName(propertyKey);
		scope = new ReactiveScope(scopeContext, 'block', childName, this.observer);
		this.scopeMap.set(propertyKey, scope);
		return scope as ReactiveScope<V>;
	}

	private getEventName(child: PropertyKey): string {
		if (this.name) {
			if (typeof child === 'number' || typeof child === 'symbol') {
				return `${String(this.name)}['${String(child)}']`;
			}
			return `${String(this.name)}.${String(child)}`;
		}
		return String(child);
	}

	subscribe(callback: (propertyKey: PropertyKey, oldValue: any, newValue: any) => void): Subscription<T> {
		return this.observer.subscribe(callback);
	}

	remove(subscription: Subscription<T>) {
		this.observer.remove(subscription);
	}
}
