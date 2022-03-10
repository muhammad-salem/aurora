
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
	 * get a proxy of the current context object if exists. 
	 */
	getContextProxy?(): T;

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
	static for<T extends ScopeContext>(context: T, type: ScopeType, propertyKeys?: (keyof T)[]) {
		return new Scope(context, type, propertyKeys);
	}
	static blockScopeFor<T extends ScopeContext>(context: T, propertyKeys?: (keyof T)[]) {
		return new Scope(context, 'block', propertyKeys);
	}
	static functionScopeFor<T extends ScopeContext>(context: T, propertyKeys?: (keyof T)[]) {
		return new Scope(context, 'function', propertyKeys);
	}
	static classScopeFor<T extends ScopeContext>(context: T, propertyKeys?: (keyof T)[]) {
		return new Scope(context, 'class', propertyKeys);
	}
	static moduleScopeFor<T extends ScopeContext>(context: T, propertyKeys?: (keyof T)[]) {
		return new Scope(context, 'module', propertyKeys);
	}
	static globalScopeFor<T extends ScopeContext>(context: T, propertyKeys?: (keyof T)[]) {
		return new Scope(context, 'global', propertyKeys);
	}
	static blockScope<T extends ScopeContext>(propertyKeys?: (keyof T)[]) {
		return new Scope({} as T, 'block', propertyKeys);
	}
	static functionScope<T extends ScopeContext>(propertyKeys?: (keyof T)[]) {
		return new Scope({} as T, 'function', propertyKeys);
	}
	static classScope<T extends ScopeContext>(propertyKeys?: (keyof T)[]) {
		return new Scope({} as T, 'class', propertyKeys);
	}
	static moduleScope<T extends ScopeContext>(propertyKeys?: (keyof T)[]) {
		return new Scope({} as T, 'module', propertyKeys);
	}
	static globalScope<T extends ScopeContext>(propertyKeys?: (keyof T)[]) {
		return new Scope({} as T, 'global', propertyKeys);
	}
	protected scopeMap = new Map<keyof T, Scope<any>>();
	protected propertyKeys?: (keyof T)[];
	constructor(protected context: T, public type: ScopeType, propertyKeys?: (keyof T)[]) {
		this.propertyKeys = propertyKeys;
		if (Array.isArray(this.propertyKeys)) {
			this.has = (propertyKey: keyof T): boolean => {
				return this.propertyKeys!.includes(propertyKey);
			};
		}
	}
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
	static for<T extends ScopeContext>(context: T, type: ScopeType, propertyKeys?: (keyof T)[]) {
		return new ReadOnlyScope(context, type, propertyKeys);
	}
	static blockScopeFor<T extends ScopeContext>(context: T, propertyKeys?: (keyof T)[]) {
		return new ReadOnlyScope(context, 'block', propertyKeys);
	}
	static functionScopeFor<T extends ScopeContext>(context: T, propertyKeys?: (keyof T)[]) {
		return new ReadOnlyScope(context, 'function', propertyKeys);
	}
	static classScopeFor<T extends ScopeContext>(context: T, propertyKeys?: (keyof T)[]) {
		return new ReadOnlyScope(context, 'class', propertyKeys);
	}
	static moduleScopeFor<T extends ScopeContext>(context: T, propertyKeys?: (keyof T)[]) {
		return new ReadOnlyScope(context, 'module', propertyKeys);
	}
	static globalScopeFor<T extends ScopeContext>(context: T, propertyKeys?: (keyof T)[]) {
		return new ReadOnlyScope(context, 'global', propertyKeys);
	}
	static blockScope<T extends ScopeContext>(propertyKeys?: (keyof T)[]) {
		return new ReadOnlyScope({} as T, 'block', propertyKeys);
	}
	static functionScope<T extends ScopeContext>(propertyKeys?: (keyof T)[]) {
		return new ReadOnlyScope({} as T, 'function', propertyKeys);
	}
	static classScope<T extends ScopeContext>(propertyKeys?: (keyof T)[]) {
		return new ReadOnlyScope({} as T, 'class', propertyKeys);
	}
	static moduleScope<T extends ScopeContext>(propertyKeys?: (keyof T)[]) {
		return new ReadOnlyScope({} as T, 'module', propertyKeys);
	}
	static globalScope<T extends ScopeContext>(propertyKeys?: (keyof T)[]) {
		return new ReadOnlyScope({} as T, 'global', propertyKeys);
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
		if (!subscribers || subscribers.size == 0) {
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
	static for<T extends ScopeContext>(context: T, type: ScopeType, propertyKeys?: (keyof T)[]) {
		return new ReactiveScope(context, type, propertyKeys);
	}
	static blockScopeFor<T extends ScopeContext>(context: T, propertyKeys?: (keyof T)[]) {
		return new ReactiveScope(context, 'block', propertyKeys);
	}
	static functionScopeFor<T extends ScopeContext>(context: T, propertyKeys?: (keyof T)[]) {
		return new ReactiveScope(context, 'function', propertyKeys);
	}
	static classScopeFor<T extends ScopeContext>(context: T, propertyKeys?: (keyof T)[]) {
		return new ReactiveScope(context, 'class', propertyKeys);
	}
	static moduleScopeFor<T extends ScopeContext>(context: T, propertyKeys?: (keyof T)[]) {
		return new ReactiveScope(context, 'module', propertyKeys);
	}
	static globalScopeFor<T extends ScopeContext>(context: T, propertyKeys?: (keyof T)[]) {
		return new ReactiveScope(context, 'global', propertyKeys);
	}
	static blockScope<T extends ScopeContext>(propertyKeys?: (keyof T)[]) {
		return new ReactiveScope({} as T, 'block', propertyKeys);
	}
	static functionScope<T extends ScopeContext>(propertyKeys?: (keyof T)[]) {
		return new ReactiveScope({} as T, 'function', propertyKeys);
	}
	static classScope<T extends ScopeContext>(propertyKeys?: (keyof T)[]) {
		return new ReactiveScope({} as T, 'class', propertyKeys);
	}
	static moduleScope<T extends ScopeContext>(propertyKeys?: (keyof T)[]) {
		return new ReactiveScope({} as T, 'module', propertyKeys);
	}
	static globalScope<T extends ScopeContext>(propertyKeys?: (keyof T)[]) {
		return new ReactiveScope({} as T, 'global', propertyKeys);
	}

	protected observer: ValueChangeObserver<T> = new ValueChangeObserver<T>();
	protected name?: string;

	constructor(context: T, type: ScopeType, propertyKeys?: (keyof T)[]);
	constructor(context: T, type: ScopeType, name: string, parent: ReactiveScope<any>, propertyKeys?: (keyof T)[]);
	constructor(context: T, type: ScopeType, name?: string | (keyof T)[], protected parent?: ReactiveScope<any>, propertyKeys?: (keyof T)[]) {
		super(context, type, Array.isArray(name) ? name : propertyKeys);
		if (typeof name == 'string') {
			this.name = name;
		}
		if (Array.isArray(name)) {
			this.propertyKeys = name;
		}
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
		// scope = new (this.constructor as (new (context: V, type: ScopeType, name: string, parent: ReactiveScope<T>) => ReactiveScope<V>))(scopeContext, 'block', propertyKey as string, this);
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

/**
 * used control/notify/pause scope about changes in current context
 */
export interface ScopeControl<T extends ScopeContext> {

	/**
	 * get current stacte of applying change detection.
	 */
	isAttached(): boolean;

	/**
	 * used when want to update ui-view like, you want to replace an array with another 
	 * without reflect changes on view until reattached again.
	 */
	detach(): void;

	/**
	 * apply all the not emitted changes, and continue emit in time.
	 */
	reattach(): void;

	/**
	 * apply changes now,
	 * will not effect the state of the detector wither if attached ot not.
	 * 
	 * if a propertyKey is provided, will emit this property only 
	 * @param propertyKey 
	 */
	emitChanges(propertyKey?: keyof T, propertyValue?: any): void;
}

export class ReactiveScopeControl<T extends ScopeContext> extends ReactiveScope<T> implements ScopeControl<T> {
	static for<T extends ScopeContext>(context: T, type: ScopeType, propertyKeys?: (keyof T)[]) {
		return new ReactiveScopeControl(context, type, propertyKeys);
	}
	static blockScopeFor<T extends ScopeContext>(context: T, propertyKeys?: (keyof T)[]) {
		return new ReactiveScopeControl(context, 'block', propertyKeys);
	}
	static functionScopeFor<T extends ScopeContext>(context: T, propertyKeys?: (keyof T)[]) {
		return new ReactiveScopeControl(context, 'function', propertyKeys);
	}
	static classScopeFor<T extends ScopeContext>(context: T, propertyKeys?: (keyof T)[]) {
		return new ReactiveScopeControl(context, 'class', propertyKeys);
	}
	static moduleScopeFor<T extends ScopeContext>(context: T, propertyKeys?: (keyof T)[]) {
		return new ReactiveScopeControl(context, 'module', propertyKeys);
	}
	static globalScopeFor<T extends ScopeContext>(context: T, propertyKeys?: (keyof T)[]) {
		return new ReactiveScopeControl(context, 'global', propertyKeys);
	}
	static blockScope<T extends ScopeContext>(propertyKeys?: (keyof T)[]) {
		return new ReactiveScopeControl({} as T, 'block', propertyKeys);
	}
	static functionScope<T extends ScopeContext>(propertyKeys?: (keyof T)[]) {
		return new ReactiveScopeControl({} as T, 'function', propertyKeys);
	}
	static classScope<T extends ScopeContext>(propertyKeys?: (keyof T)[]) {
		return new ReactiveScopeControl({} as T, 'class', propertyKeys);
	}
	static moduleScope<T extends ScopeContext>(propertyKeys?: (keyof T)[]) {
		return new ReactiveScopeControl({} as T, 'module', propertyKeys);
	}
	static globalScope<T extends ScopeContext>(propertyKeys?: (keyof T)[]) {
		return new ReactiveScopeControl({} as T, 'global', propertyKeys);
	}

	protected attached: boolean = true;
	protected marked: ScopeContext = {};
	override emit(propertyKey: keyof T, newValue: any, oldValue?: any): void {
		if (this.attached) {
			super.emit(propertyKey, newValue, oldValue);
		} else {
			this.marked[propertyKey] = newValue;
		}
	}
	isAttached(): boolean {
		return this.attached;
	}
	detach(): void {
		this.attached = false;
	}
	reattach(): void {
		this.attached = true;
		this.emitChanges();
	}
	emitChanges(propertyKey?: keyof T, propertyValue?: any): void {
		if (propertyKey) {
			super.emit(propertyKey, propertyValue);
			Reflect.deleteProperty(this.marked, propertyKey);
			return;
		}
		const latestChanges = this.marked;
		this.marked = {};
		Object.keys(latestChanges).forEach(propertyKey => {
			super.emit(propertyKey, latestChanges[propertyKey]);
		});
	}
}
