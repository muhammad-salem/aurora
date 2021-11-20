
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
	constructor(private propertyKey: keyof T, private observer: ValueChangeObserver<T>,) { }
	unsubscribe(): void {
		this.observer.unsubscribe(this.propertyKey, this);
	}
}

export type ValueChangedCallback = (newValue: any, oldValue?: any) => void;

export class ValueChangeObserver<T> {
	private subscribers: Map<keyof T, Map<ScopeSubscription<T>, ValueChangedCallback>> = new Map();
	private propertyLock: Map<keyof T, boolean> = new Map();
	emit(propertyKey: keyof T, newValue: any, oldValue?: any): void {
		const lock = this.propertyLock.get(propertyKey);
		if (lock || lock == undefined) {
			return;
		}
		this.propertyLock.set(propertyKey, true);
		const subscribers = this.subscribers.get(propertyKey);
		subscribers?.forEach((subscribe) => {
			try {
				subscribe(oldValue, newValue);
			} catch (e) {
				console.error(e);
			}
		});
		this.propertyLock.set(propertyKey, false);
	}
	subscribe(propertyKey: keyof T, callback: ValueChangedCallback): ScopeSubscription<T> {
		const subscription: ScopeSubscription<T> = new ScopeSubscription(propertyKey, this);
		let propertySubscribers = this.subscribers.get(propertyKey);
		if (!propertySubscribers) {
			propertySubscribers = new Map();
			this.subscribers.set(propertyKey, propertySubscribers);
			this.propertyLock.set(propertyKey, false);
		}
		propertySubscribers.set(subscription, callback);
		return subscription;
	}

	unsubscribe(propertyKey: keyof T, subscription: ScopeSubscription<T>) {
		this.subscribers.get(propertyKey)?.delete(subscription);
	}

	/**
	 * clear subscription map
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
	protected observer: ValueChangeObserver<T>;
	constructor(context: T, type: ScopeType, protected name?: PropertyKey, observer?: ValueChangeObserver<any>) {
		super(context, type);
		this.observer = observer ?? new ValueChangeObserver<any>();
	}
	set(propertyKey: keyof T, newValue: any, receiver?: any): boolean {
		const oldValue = Reflect.get(this.context, propertyKey);
		const result = Reflect.set(this.context, propertyKey, newValue);
		if (result) {
			this.observer.emit(propertyKey, oldValue, newValue);
		}
		return result;
	}
	delete(propertyKey: keyof T): boolean {
		const oldValue = Reflect.get(this.context, propertyKey);
		const isDelete = Reflect.deleteProperty(this.context, propertyKey);
		if (isDelete && oldValue !== undefined) {
			this.observer.emit(propertyKey, oldValue, undefined);
		}
		return isDelete;
	}
	getScope<V extends ScopeContext>(propertyKey: keyof T): ReactiveScope<V> | undefined {
		const scopeContext = this.get(propertyKey);
		let scope = this.scopeMap.get(propertyKey) as ReactiveScope<any> | undefined;
		if (scope) {
			scope.context = scopeContext;
			return scope;
		}
		if (typeof scopeContext !== 'object') {
			return;
		}
		scope = new ReactiveScope<V>(scopeContext, 'block', propertyKey, this.observer);
		this.scopeMap.set(propertyKey, scope);
		return scope;
	}
	getScopeOrCreat<V extends ScopeContext>(propertyKey: keyof T): ReactiveScope<V> {
		const scopeContext = this.get(propertyKey);
		let scope = this.scopeMap.get(propertyKey) as ReactiveScope<any> | undefined;
		if (scope) {
			scope.context = scopeContext;
			return scope;
		}
		scope = new ReactiveScope<V>(scopeContext, 'block', propertyKey, this.observer);
		this.scopeMap.set(propertyKey, scope);
		return scope;
	}

	subscribe(propertyKey: keyof T, callback: ValueChangedCallback): ScopeSubscription<T> {
		return this.observer.subscribe(propertyKey, callback);
	}

	unsubscribe(propertyKey: keyof T, subscription?: ScopeSubscription<T>) {
		if (subscription) {
			this.observer.unsubscribe(propertyKey, subscription);
		} else {
			this.observer.destroy();
		}
	}
}
