
export type ScopeType = 'block' | 'function' | 'class' | 'module' | 'global';

export type ScopeContext = { [key: PropertyKey]: ScopeContext | any };
export interface Scope<T = ScopeContext> {

	/**
	 * scope type
	 */
	type: ScopeType;

	/**
	 * get value of `propertyKey` in current context
	 * @param propertyKey 
	 */
	get(propertyKey: keyof T): any;

	/**
	 * set the value of `propertyKey` in current context, could be instilled with `value`.
	 * @param propertyKey 
	 * @param value 
	 * @param receiver 
	 */
	set(propertyKey: keyof T, value?: any, receiver?: any): boolean;

	/**
	 * is current context has `propertyKey` in hash map keys
	 * @param propertyKey 
	 */
	has(propertyKey: keyof T): boolean;

	/**
	 * delete property from context
	 * @param propertyKey 
	 */
	delete(propertyKey: keyof T): boolean;

	/**
	 * get current context object of this scope
	 */
	getContext(): T;

	/**
	 * get a scope for an object named as `propertyKey` from cache map,
	 * 
	 * if the current value is not type od `object`, will return `undefined`.
	 * @param propertyKey the name of the property
	 */
	getScope<V extends ScopeContext>(propertyKey: keyof T): Scope<V> | undefined;

	/**
	 * get a scope for an object named as `propertyKey` from cache map,
	 * 
	 * if no scope found in the cache, will create a new one, add this one to the map, return a reference.
	 * @param propertyKey
	 */
	getScopeOrCreat<V extends ScopeContext>(propertyKey: keyof T): Scope<V>;
}

export class Scope<T extends ScopeContext> implements Scope<T> {
	static for<T extends ScopeContext>(context: T, type: ScopeType) {
		return new Scope(context, type);
	}
	static blockScopeFor<T extends ScopeContext>(context: T) {
		return new Scope(context, 'block');
	}
	static functionScopeFor<T extends ScopeContext>(context: T) {
		return new Scope(context, 'function');
	}
	static classScopeFor<T extends ScopeContext>(context: T) {
		return new Scope(context, 'class');
	}
	static moduleScopeFor<T extends ScopeContext>(context: T) {
		return new Scope(context, 'module');
	}
	static globalScopeFor<T extends ScopeContext>(context: T) {
		return new Scope(context, 'global');
	}
	static blockScope<T extends ScopeContext>() {
		return new Scope({} as T, 'block');
	}
	static functionScope<T extends ScopeContext>() {
		return new Scope({} as T, 'function');
	}
	static classScope<T extends ScopeContext>() {
		return new Scope({} as T, 'class');
	}
	static moduleScope<T extends ScopeContext>() {
		return new Scope({} as T, 'module');
	}
	static globalScope<T extends ScopeContext>() {
		return new Scope({} as T, 'global');
	}
	protected scopeMap = new Map<keyof T, Scope<any>>();
	constructor(protected context: T, public type: ScopeType) { }
	get(propertyKey: keyof T): any {
		return Reflect.get(this.context, propertyKey);
	}
	set(propertyKey: keyof T, value: any, receiver?: any): boolean {
		return Reflect.set(this.context, propertyKey, value);
	}
	has(propertyKey: keyof T): boolean {
		return propertyKey in this.context;
	}
	delete(propertyKey: keyof T): boolean {
		return Reflect.deleteProperty(this.context, propertyKey);
	}
	getContext(): T {
		return this.context;
	}
	getScope<V extends ScopeContext>(propertyKey: keyof T): Scope<V> | undefined {
		const scopeContext = this.get(propertyKey);
		let scope = this.scopeMap.get(propertyKey);
		if (scope) {
			scope.context = scopeContext;
			return scope;
		}
		if (typeof scopeContext !== 'object') {
			return;
		}
		scope = new Scope(scopeContext, 'block');
		this.scopeMap.set(propertyKey, scope);
		return scope;
	}
	getScopeOrCreat<V extends ScopeContext>(propertyKey: keyof T): Scope<V> {
		const scopeContext = this.get(propertyKey);
		let scope = this.scopeMap.get(propertyKey);
		if (scope) {
			scope.context = scopeContext;
			return scope;
		}
		scope = new Scope(scopeContext, 'block');
		this.scopeMap.set(propertyKey, scope);
		return scope;
	}
}

export class ReadOnlyScope<T extends ScopeContext> extends Scope<T> {
	static for<T extends ScopeContext>(context: T, type: ScopeType) {
		return new ReadOnlyScope(context, type);
	}
	static blockScopeFor<T extends ScopeContext>(context: T) {
		return new ReadOnlyScope(context, 'block');
	}
	static functionScopeFor<T extends ScopeContext>(context: T) {
		return new ReadOnlyScope(context, 'function');
	}
	static classScopeFor<T extends ScopeContext>(context: T) {
		return new ReadOnlyScope(context, 'class');
	}
	static moduleScopeFor<T extends ScopeContext>(context: T) {
		return new ReadOnlyScope(context, 'module');
	}
	static globalScopeFor<T extends ScopeContext>(context: T) {
		return new ReadOnlyScope(context, 'global');
	}
	static blockScope<T extends ScopeContext>() {
		return new ReadOnlyScope({} as T, 'block');
	}
	static functionScope<T extends ScopeContext>() {
		return new ReadOnlyScope({} as T, 'function');
	}
	static classScope<T extends ScopeContext>() {
		return new ReadOnlyScope({} as T, 'class');
	}
	static moduleScope<T extends ScopeContext>() {
		return new ReadOnlyScope({} as T, 'module');
	}
	static globalScope<T extends ScopeContext>() {
		return new ReadOnlyScope({} as T, 'global');
	}
	set(propertyKey: keyof T, value: any, receiver?: any): boolean {
		// do nothing
		return false;
	}
	delete(propertyKey: keyof T): boolean {
		// do nothing
		return false;
	}
}

export class ScopeSubscription<T> {
	constructor(private propertyKey: keyof T, private observer: ValueChangeObserver<T>) { }
	pause() {
		this.observer.pause(this.propertyKey, this);
	}
	resume() {
		this.observer.resume(this.propertyKey, this);
	}
	unsubscribe(): void {
		this.observer.unsubscribe(this.propertyKey, this);
	}
}

export type ValueChangedCallback = (newValue: any, oldValue?: any) => void;

type SubscriptionInfo = { callback: ValueChangedCallback, enable: boolean };

export class ValueChangeObserver<T> {
	private subscribers: Map<keyof T, Map<ScopeSubscription<T>, SubscriptionInfo>> = new Map();
	private propertiesLock: (keyof T)[] = [];
	emit(propertyKey: keyof T, newValue: any, oldValue?: any): void {
		if (this.propertiesLock.includes(propertyKey)) {
			return;
		}
		const subscribers = this.subscribers.get(propertyKey);
		if (!subscribers) {
			return;
		}
		this.propertiesLock.push(propertyKey);
		subscribers?.forEach(subscriptionInfo => {
			if (!subscriptionInfo.enable) {
				return;
			}
			try {
				subscriptionInfo.callback(newValue, oldValue);
			} catch (e) {
				console.error(e);
			}
		});
		if (this.propertiesLock.pop() !== propertyKey) {
			console.error('lock error');
		};
	}
	subscribe(propertyKey: keyof T, callback: ValueChangedCallback): ScopeSubscription<T> {
		const subscription: ScopeSubscription<T> = new ScopeSubscription(propertyKey, this);
		let propertySubscribers = this.subscribers.get(propertyKey);
		if (!propertySubscribers) {
			propertySubscribers = new Map();
			this.subscribers.set(propertyKey, propertySubscribers);
		}
		propertySubscribers.set(subscription, { callback, enable: true });
		return subscription;
	}

	unsubscribe(propertyKey: keyof T, subscription?: ScopeSubscription<T>) {
		if (subscription) {
			this.subscribers.get(propertyKey)?.delete(subscription);
		} else {
			this.subscribers.delete(propertyKey);
		}
	}

	pause(propertyKey: keyof T, subscription: ScopeSubscription<T>) {
		const subscriptionInfo = this.subscribers.get(propertyKey)?.get(subscription);
		subscriptionInfo && (subscriptionInfo.enable = false);
	}

	resume(propertyKey: keyof T, subscription: ScopeSubscription<T>) {
		const subscriptionInfo = this.subscribers.get(propertyKey)?.get(subscription);
		subscriptionInfo && (subscriptionInfo.enable = true);
	}

	/**
	 * clear subscription maps
	 */
	destroy() {
		this.subscribers.clear();
	}
}

export class ReactiveScope<T extends ScopeContext> extends Scope<T> {
	static for<T extends ScopeContext>(context: T, type: ScopeType) {
		return new ReactiveScope(context, type);
	}
	static blockScopeFor<T extends ScopeContext>(context: T) {
		return new ReactiveScope(context, 'block');
	}
	static functionScopeFor<T extends ScopeContext>(context: T) {
		return new ReactiveScope(context, 'function');
	}
	static classScopeFor<T extends ScopeContext>(context: T) {
		return new ReactiveScope(context, 'class');
	}
	static moduleScopeFor<T extends ScopeContext>(context: T) {
		return new ReactiveScope(context, 'module');
	}
	static globalScopeFor<T extends ScopeContext>(context: T) {
		return new ReactiveScope(context, 'global');
	}
	static blockScope<T extends ScopeContext>() {
		return new ReactiveScope({} as T, 'block');
	}
	static functionScope<T extends ScopeContext>() {
		return new ReactiveScope({} as T, 'function');
	}
	static classScope<T extends ScopeContext>() {
		return new ReactiveScope({} as T, 'class');
	}
	static moduleScope<T extends ScopeContext>() {
		return new ReactiveScope({} as T, 'module');
	}
	static globalScope<T extends ScopeContext>() {
		return new ReactiveScope({} as T, 'global');
	}

	protected observer: ValueChangeObserver<T> = new ValueChangeObserver<T>();

	constructor(context: T, type: ScopeType);
	constructor(context: T, type: ScopeType, name: string, parent: ReactiveScope<any>);
	constructor(context: T, type: ScopeType, protected name?: string, protected parent?: ReactiveScope<any>) {
		super(context, type);
	}

	set(propertyKey: keyof T, newValue: any, receiver?: any): boolean {
		const oldValue = Reflect.get(this.context, propertyKey);
		const result = Reflect.set(this.context, propertyKey, newValue);
		if (result) {
			this.emit(propertyKey, newValue, oldValue);
		}
		return result;
	}
	delete(propertyKey: keyof T): boolean {
		const oldValue = Reflect.get(this.context, propertyKey);
		const isDelete = Reflect.deleteProperty(this.context, propertyKey);
		if (isDelete && oldValue !== undefined) {
			this.emit(propertyKey, undefined, oldValue);
		}
		return isDelete;
	}
	getScope<V extends ScopeContext>(propertyKey: keyof T): ReactiveScope<V> | undefined {
		const scopeContext = this.get(propertyKey) as V;
		let scope = this.scopeMap.get(propertyKey) as ReactiveScope<any> | undefined;
		if (scope) {
			scope.context = scopeContext;
			return scope;
		}
		if (typeof scopeContext !== 'object') {
			return;
		}
		scope = new ReactiveScope<V>(scopeContext, 'block', propertyKey as string, this);
		this.scopeMap.set(propertyKey, scope);
		return scope;
	}
	getScopeOrCreat<V extends ScopeContext>(propertyKey: keyof T): ReactiveScope<V> {
		const scopeContext = this.get(propertyKey) as V;
		let scope = this.scopeMap.get(propertyKey) as ReactiveScope<any> | undefined;
		if (scope) {
			scope.context = scopeContext;
			return scope;
		}
		scope = new ReactiveScope<V>(scopeContext, 'block', propertyKey as string, this);
		this.scopeMap.set(propertyKey, scope);
		return scope;
	}

	emit(propertyKey: keyof T, newValue: any, oldValue?: any): void {
		this.observer.emit(propertyKey, newValue, oldValue);
		this.parent?.emit(this.name!, this.context);
	}

	subscribe(propertyKey: keyof T, callback: ValueChangedCallback): ScopeSubscription<T> {
		return this.observer.subscribe(propertyKey, callback);
	}

	unsubscribe(propertyKey?: keyof T, subscription?: ScopeSubscription<T>) {
		if (propertyKey && subscription) {
			this.observer.unsubscribe(propertyKey, subscription);
		} else if (propertyKey) {

			this.observer.unsubscribe(propertyKey);
		} else {
			this.observer.destroy();
		}
	}
}
