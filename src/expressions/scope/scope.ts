
export type ScopeType = 'block' | 'function' | 'class' | 'module' | 'global';

export interface Scope<T> {

	/**
	 * scope type
	 */
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
	 * delete property from context
	 * @param propertyKey 
	 */
	delete(propertyKey: PropertyKey): boolean;

	/**
	 * get current context object of this scope
	 */
	getContext(): T;

	/**
	 * get a scope for an object named as `propertyKey` from cache map
	 * @param propertyKey the name of the property
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
	static classScopeFor<T extends object>(context: T) {
		return new Scope(context, 'class');
	}
	static moduleScopeFor<T extends object>(context: T) {
		return new Scope(context, 'module');
	}
	static globalScopeFor<T extends object>(context: T) {
		return new Scope(context, 'global');
	}
	static blockScope<T extends object>() {
		return new Scope({} as T, 'block');
	}
	static functionScope<T extends object>() {
		return new Scope({} as T, 'function');
	}
	static classScope<T extends object>() {
		return new Scope({} as T, 'class');
	}
	static moduleScope<T extends object>() {
		return new Scope({} as T, 'module');
	}
	static globalScope<T extends object>() {
		return new Scope({} as T, 'global');
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
	delete(propertyKey: PropertyKey): boolean {
		return Reflect.deleteProperty(this.context, propertyKey);
	}
	getContext(): T {
		return this.context;
	}
	getScope<V extends object>(propertyKey: PropertyKey): Scope<V> | undefined {
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

export class ReadOnlyScope<T extends object> extends Scope<T> {
	static for<T extends object>(context: T, type: ScopeType) {
		return new ReadOnlyScope(context, type);
	}
	static blockScopeFor<T extends object>(context: T) {
		return new ReadOnlyScope(context, 'block');
	}
	static functionScopeFor<T extends object>(context: T) {
		return new ReadOnlyScope(context, 'function');
	}
	static classScopeFor<T extends object>(context: T) {
		return new ReadOnlyScope(context, 'class');
	}
	static moduleScopeFor<T extends object>(context: T) {
		return new ReadOnlyScope(context, 'module');
	}
	static globalScopeFor<T extends object>(context: T) {
		return new ReadOnlyScope(context, 'global');
	}
	static blockScope<T extends object>() {
		return new ReadOnlyScope({} as T, 'block');
	}
	static functionScope<T extends object>() {
		return new ReadOnlyScope({} as T, 'function');
	}
	static classScope<T extends object>() {
		return new ReadOnlyScope({} as T, 'class');
	}
	static moduleScope<T extends object>() {
		return new ReadOnlyScope({} as T, 'module');
	}
	static globalScope<T extends object>() {
		return new ReadOnlyScope({} as T, 'global');
	}
	set(propertyKey: PropertyKey, value: any, receiver?: any): boolean {
		// do nothing
		return false;
	}
	delete(propertyKey: PropertyKey): boolean {
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
	static classScopeFor<T extends object>(context: T) {
		return new ReactiveScope(context, 'class');
	}
	static moduleScopeFor<T extends object>(context: T) {
		return new ReactiveScope(context, 'module');
	}
	static globalScopeFor<T extends object>(context: T) {
		return new ReactiveScope(context, 'global');
	}
	static blockScope<T extends object>() {
		return new ReactiveScope({} as T, 'block');
	}
	static functionScope<T extends object>() {
		return new ReactiveScope({} as T, 'function');
	}
	static classScope<T extends object>() {
		return new ReactiveScope({} as T, 'class');
	}
	static moduleScope<T extends object>() {
		return new ReactiveScope({} as T, 'module');
	}
	static globalScope<T extends object>() {
		return new ReactiveScope({} as T, 'global');
	}
	private observer: ValueChangeObserver<T>;
	constructor(context: T, type: ScopeType, protected name?: PropertyKey, observer?: ValueChangeObserver<T>) {
		super(context, type);
		this.observer = observer ?? new ValueChangeObserver(name as string);
	}
	set(propertyKey: PropertyKey, newValue: any, receiver?: any): boolean {
		const oldValue = Reflect.get(this.context, propertyKey);
		const result = Reflect.set(this.context, propertyKey, newValue);
		if (result) {
			this.observer.emit(this.getEventName(propertyKey), oldValue, newValue);
		}
		return result;
	}
	delete(propertyKey: PropertyKey): boolean {
		const oldValue = Reflect.get(this.context, propertyKey);
		const isDelete = Reflect.deleteProperty(this.context, propertyKey);
		if (isDelete && oldValue !== undefined) {
			this.observer.emit(this.getEventName(propertyKey), oldValue, undefined);
		}
		return isDelete;
	}
	getScope<V extends object>(propertyKey: PropertyKey): ReactiveScope<V> | undefined {
		const scopeContext = this.get(propertyKey);
		let scope = this.scopeMap.get(propertyKey) as ReactiveScope<V>;
		if (scope) {
			scope.context = scopeContext;
			return scope;
		}
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
